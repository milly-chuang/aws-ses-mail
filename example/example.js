var awsSesMail = require('../aws-ses-mail');
var fs = require('fs');

var sesMail = new awsSesMail();

// Setting config
sesMail.setConfigFromFile('config/aws-ses-mail.conf');

// Setting sender, must verified in Amazon SES
sesMail.setSender('SENDER <SENDER@DOMAIN_NAME>');

var subject = 'Test';
var templateName = 'example'
var templateArgs = {
  greeting: 'Thank you for using aws-ses-mail.'
};

sesMail.setSubject(subject);
sesMail.setContent('templates/' + templateName, templateArgs);

// send all Email address in once(The combined number of To:, CC: and BCC: email addresses cannot exceed 50)
var receiver = new Array();
receiver.push('receiver1@gmail.com');
receiver.push('receiver2@gmail.com');
sesMail.setReceiver(receiver);

receiver = new Array();
receiver.push('ccReceiver1@gmail.com');
receiver.push('ccReceiver2@gmail.com');
sesMail.setCcReceiver(receiver);

sesMail.sendEmail();


// Read email list from file and batch send
var mailListFile = './maillist.txt';
var mailList = fs.readFileSync(mailListFile, 'utf8').trim().split('\n');

sesMail.sendEmailBatch(mailList);
