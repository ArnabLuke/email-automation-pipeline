function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Email Tool')
    .addItem('Extract Emails', 'showSidebar')
    .addItem('Send Reply', 'showReplySidebar')
    .addItem('Reply with Attachments', 'showReplyWithAttachmentsSidebar')
    .addItem('Forward Emails', 'showForwardSidebar')
    .addToUi();
}

function showSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle('Email Extractor');
  SpreadsheetApp.getUi().showSidebar(html);
}

function showReplySidebar() {
  var html = HtmlService.createHtmlOutputFromFile('ReplySidebar')
    .setTitle('Send Replies');
  SpreadsheetApp.getUi().showSidebar(html);
}

function showReplyWithAttachmentsSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('ReplyWithAttachmentsSidebar')
    .setTitle('Send Replies with Attachments');
  SpreadsheetApp.getUi().showSidebar(html);
}

function showForwardSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('ForwardSidebar')
  .setTitle('Forward Emails');
  SpreadsheetApp.getUi().showSidebar(html);}

function extractEmailsToSheet(startDate, endDate, labelName, sender, recipients, excludeSender, subject, excludelabelName,excludeRecipients) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // Clear previous data
  sheet.clear();
  
  // Set up the headers
  var headers = ['Date', 'Body', 'Sender', 'Recipient', 'Subject', 'Label', 'Attachment File Name', 'Email sent status', 'Destination Email','CC','BCC'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Define the search criteria for emails
  var query = 'after:' + startDate + ' before:' + endDate;
  if (labelName) {
    query += ' label:' + labelName;
  }
  if (sender) {
    query += ' from:' + sender;
  }
  if (recipients) {
    query += ' to:' + recipients;
  }
  if (excludeSender) {
    query += ' -from:' + excludeSender;
  }
  if (subject) {
    query += ' subject:' + subject;
  }
  if (excludelabelName) {
    query += ' -label:' + excludelabelName;
  }
  if (excludeRecipients) {
    query += ' -to:' + excludeRecipients;
  }
  
  Logger.log('Query: ' + query);
  
  var row = 2;
  var start = 0;
  var maxResults = 500; // Set batch size (maximum 500)
  var threads;
  
  do {
    threads = GmailApp.search(query, start, maxResults);
    Logger.log('Processing batch starting from index: ' + start + ', found ' + threads.length + ' threads.');
    
    for (var i = 0; i < threads.length; i++) {
      var thread = threads[i];
      var labels = thread.getLabels().map(label => label.getName()).join(', ');
      var messages = thread.getMessages();
      
      for (var j = 0; j < messages.length; j++) {
        var message = messages[j];
        
        if (excludeSender && message.getFrom().includes(excludeSender)) {
          continue;
        }
        
        var date = message.getDate();
        var sender = message.getFrom();
        var recipient = message.getTo();
        var subject = message.getSubject();
        var body = message.getPlainBody();
        
        sheet.getRange('A' + row).setValue(date);
        sheet.getRange('B' + row).setValue(body);
        sheet.getRange('C' + row).setValue(sender);
        sheet.getRange('D' + row).setValue(recipient);
        sheet.getRange('E' + row).setValue(subject);
        sheet.getRange('F' + row).setValue(labels);
        sheet.getRange('G' + row).setValue(''); // Placeholder for attachment file name
        sheet.getRange('H' + row).setValue('No'); // Default status is No
        sheet.getRange('I' + row).setValue(''); // Placeholder for destination email
        sheet.getRange('J' + row).setValue(''); // Placeholder for CC email
        sheet.getRange('K' + row).setValue(''); // Placeholder for BCC email
        
        row++;
      }
    }
    
    start += maxResults;
    
  } while (threads.length === maxResults);
  
  Logger.log('Emails extracted successfully.');
  SpreadsheetApp.getUi().alert('Emails extracted successfully.');
}

function sendReply(row) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var emailBody = sheet.getRange('H1').getValue(); // Email body from the sidebar input
  var sender = sheet.getRange('C' + row).getValue();
  var subject = sheet.getRange('E' + row).getValue();
  
  var query = `from:${sender} subject:"${subject}"`;
  var threads = GmailApp.search(query);
  if (threads.length > 0) {
    var thread = threads[0];
    var options = {
      htmlBody: emailBody.replace(/\n/g, "<br>"),
      to: sender // Ensure the reply goes only to the sender
    };
    // Add CC and BCC if provided
    if (cc) {
      options.cc = cc;
    }
    if (bcc) {
      options.bcc = bcc;
    }
    
    if (sheet.getRange('H' + row).getValue() !== 'Yes') { // Check if reply already sent
      thread.reply('', options); // Send reply with the correct options
      sheet.getRange('H' + row).setValue('Yes'); // Mark as sent
    }
  } else {
    sheet.getRange('H' + row).setValue('Thread not found');
  }
}

function sendAllReplies(emailBody) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  
  for (var row = 2; row <= data.length; row++) {
    var sender = sheet.getRange('C' + row).getValue();
    if (!sender) {
      continue; // Skip empty rows
    }
    sheet.getRange('H1').setValue(emailBody); // Set email body for each row
    sendReply(row);
  }
  SpreadsheetApp.getUi().alert('All replies sent.');
}

function sendReplyWithAttachments(row) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var emailBody = sheet.getRange('H1').getValue(); // Email body from the sidebar input
  var attachmentFileName = sheet.getRange('G' + row).getValue();
  var sender = sheet.getRange('C' + row).getValue();
  var subject = sheet.getRange('E' + row).getValue();
  var cc = sheet.getRange('J' + row).getValue();
  var bcc = sheet.getRange('K' + row).getValue();
  
  var query = `from:${sender} subject:"${subject}"`;
  var threads = GmailApp.search(query);
  if (threads.length > 0) {
    var thread = threads[0];
    var options = {
      htmlBody: emailBody.replace(/\n/g, "<br>"),
      to: sender // Ensure the reply goes only to the sender
    };
	// Add CC and BCC if provided
    if (cc) {
      options.cc = cc;
    }
    if (bcc) {
      options.bcc = bcc;
    }
	
    if (attachmentFileName) {
      var attachment = DriveApp.getFilesByName(attachmentFileName);
      if (attachment.hasNext()) {
        var file = attachment.next();
        var blob = file.getBlob();
        options.attachments = [blob];
      } else {
        sheet.getRange('H' + row).setValue('Attachment not found');
        return;
      }
    }
    if (sheet.getRange('H' + row).getValue() !== 'Yes') { // Check if reply already sent
      thread.reply('', options); // Send reply with the correct options
      sheet.getRange('H' + row).setValue('Yes'); // Mark as sent
    }
  } else {
    sheet.getRange('H' + row).setValue('Thread not found');
  }
}

function sendAllRepliesWithAttachments(emailBody) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  
  for (var row = 2; row <= data.length; row++) {
    var sender = sheet.getRange('C' + row).getValue();
    if (!sender) {
      continue; // Skip empty rows
    }
    sheet.getRange('H1').setValue(emailBody); // Set email body for each row
    sendReplyWithAttachments(row);
  }
  SpreadsheetApp.getUi().alert('All replies sent.');
}

function forwardEmail(row, emailBody) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var destinationEmail = sheet.getRange('I' + row).getValue(); // Destination email from column I
  var ccEmail = sheet.getRange('J' + row).getValue(); // CC email from column J
  var bccEmail = sheet.getRange('K' + row).getValue(); // BCC email from column K
  var originalBody = sheet.getRange('B' + row).getValue(); // Original email body from column B
  var subject = 'Fwd: ' + sheet.getRange('E' + row).getValue(); // Prepend 'Fwd:' to original subject
  var originalFrom = sheet.getRange('C' + row).getValue(); // Original email sender from column C
  var originalDate = sheet.getRange('A' + row).getValue(); // Original email date from column A
  var originalTo = sheet.getRange('D' + row).getValue(); // Original email recipient from column D

  Logger.log('Forwarding email to row ' + row + ' with destination email: ' + destinationEmail);

  if (destinationEmail) {
    var separator = '<br><br>---------- Forwarded message ----------<br>'+
                    'From: ' + originalFrom + '<br>' +
                    'Date: ' + originalDate + '<br>' +
                    'Subject: ' + subject + '<br>' +
                    'To: ' + originalTo + '<br><br>';
    var options = {
      htmlBody: emailBody.replace(/\n/g, "<br>") + separator + originalBody.replace(/\n/g, "<br>"),
      cc: ccEmail || '',
      bcc: bccEmail || ''
    };
if (sheet.getRange('H' + row).getValue() !== 'Yes') { // Check if email already forwarded
      GmailApp.sendEmail(destinationEmail, subject, '', options); // Send email with the correct options
      sheet.getRange('H' + row).setValue('Yes'); // Mark as sent
      Logger.log('Email forwarded to ' + destinationEmail);
    }
  } else {
    sheet.getRange('H' + row).setValue('Destination email not found');
    Logger.log('Destination email not found for row ' + row);
  }
}

function forwardAllEmails(emailBody) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();

  for (var row = 2; row <= data.length; row++) {
    var destinationEmail = sheet.getRange('I' + row).getValue();
    if (!destinationEmail) {
      Logger.log('Skipping row ' + row + ' due to missing destination email');
      continue; // Skip rows without destination email
    }
    forwardEmail(row, emailBody);
  }
  SpreadsheetApp.getUi().alert('All emails forwarded.');
}
