/**
 * @author Milly <milly@wavinfo.com>
 */
var AWS = require('aws-sdk');
var fs = require('fs'); 
var jade = require('jade');
var async = require('async');

(function(){
  var awsSesMail = function (){
    /**
     * Global variables
     *
     * @private
     */
    var _sender;
    var _receiver;
    var _ccReceiver;
    var _bccReceiver;
    var _subject;
    var _mailBody;

    /**
     * Setting AWS credentials from object
     *
     * @param {Object} conf - Config object
     */
    var setConfig = function setConfig (config) {
      AWS.config.update(config);
    }

    /**
     * Setting AWS credentials from JSON format file
     *
     * @param {string} configPath - Config file path
     */
    var setConfigFromFile = function setConfigFromFile (configPath) {
      AWS.config.loadFromPath(configPath);
    }

    /**
     * Setting sender's email address
     *
     * @param {string} sender - sender email address(Must verified in Amazon SES)
     */
    var setSender = function setSender (sender) {
      _sender = sender;
    }

    /**
     * Setting the destination for this email(To)
     *
     * @param {string[]} receiver - receiver list
     */
    var setReceiver = function setReceiver (receiver) {
      _receiver = receiver;
    }

    /**
     * Setting the destination for this email(Cc)
     *
     * @param {string[]} receiver - receiver list
     */
    var setCcReceiver = function setReceiver (receiver) {
      _ccReceiver = receiver;
    }

    /**
     * Setting the destination for this email(Bcc)
     *
     * @param {string[]} receiver - receiver list
     */
    var setBccReceiver = function setReceiver (receiver) {
      _bccReceiver = receiver;
    }

    /**
     * Setting email subject
     *
     * @param {string} subject - email subject
     */
    var setSubject = function setSubject (subject) {
      _subject = subject;
    }

    /**
     * Generate email content via template
     *
     * @param {string} templatePath - email template file path
     * @param {string[]} arguments - template arguments
     */
    var setContent = function setContent (templatePath, arguments)  {
      var tpl = fs.readFileSync(templatePath + '.jade', 'utf8');
      var compiledTpl = jade.compile(tpl);
      _mailBody = compiledTpl({ args: arguments });
    }

    /**
     * Send a single email, the combined number of To:, CC: and BCC: email addresses cannot exceed 50.
     */
    var sendEmail = function sendEmail () {
      var ses = new AWS.SES();
      var params = {
        Source: _sender,
        Destination: {},
        Message: {
          Subject: {
            Data: _subject
          },
          Body: {
            Html: {
              Data: _mailBody
            }
          }
        }
      };

      if (_receiver) {
        params.Destination.ToAddresses = _receiver;
      }

      if (_ccReceiver) {
        params.Destination.CcAddresses = _ccReceiver;
      }

      if (_bccReceiver) {
        params.Destination.BccAddresses = _bccReceiver;
      }

      ses.sendEmail(params, function (err, data) {
        var receiver = [];

        if (_receiver) receiver = receiver.concat(_receiver);
        if (_ccReceiver) receiver = receiver.concat(_ccReceiver);
        if (_bccReceiver) receiver = receiver.concat(_bccReceiver);

        console.log('Processing... ' + receiver);

        // Create log folder if not exist
        if (!fs.existsSync('log')) {
          fs.mkdirSync('log');
        }

        if (err) {
          var log = {
            'Date Time': new Date(),
            'Email': receiver,
            'Response': err,
            'Success': false
          };
            
          // Write log file
          fs.appendFile('log/ErrorLog.json', JSON.stringify(log, null, 2) + ',', function (fsErr) {
            if (fsErr) console.log(JSON.stringify(fsErr, null, 2));
          });
        } else {
          var log = {
            'Date Time': new Date(),
            'Email': receiver,
            'Response': data,
            'Success': true
          };
            
          // Write log file
          fs.appendFile('log/SendLog.json', JSON.stringify(log, null, 2) + ',', function (fsErr) {
            if (fsErr) console.log(JSON.stringify(fsErr, null, 2));
          });
        }
      });
    }

    /**
     * Batch send email
     */
    var sendEmailBatch = function sendEmailBatch () {
      var ses = new AWS.SES();

      var count = 0;
      var receiverLen = _receiver.length;
      async.whilst(
          function () { return count < receiverLen; },
          function (callback) {
            var params = {
              Source: _sender,
              Destination: {
                ToAddresses: new Array(_receiver[count])
              },
              Message: {
                Subject: {
                  Data: _subject
                },
                Body: {
                  Html: {
                    Data: _mailBody
                  }
                }
              }
            };
            count++;

            ses.sendEmail(params, function (err, data) {
              var receiver = [];

              console.log('Processing... ' + _receiver[count - 1]);

              // Create log folder if not exist
              if (!fs.existsSync('log')) {
                fs.mkdirSync('log');
              }

              if (err) {
                var log = {
                  'Date Time': new Date(),
                  'Email': _receiver[count - 1],
                  'Response': err,
                  'Success': false
                };
                  
                // Write log file
                fs.appendFile('log/ErrorLog.json', JSON.stringify(log, null, 2) + ',', function (fsErr) {
                  if (fsErr) console.log(JSON.stringify(fsErr, null, 2));

                  return callback();
                });
              } else {
                var log = {
                  'Date Time': new Date(),
                  'Email': _receiver[count - 1],
                  'Response': data,
                  'Success': true
                };
                  
                // Write log file
                fs.appendFile('log/SendLog.json', JSON.stringify(log, null, 2) + ',', function (fsErr) {
                  if (fsErr) console.log(JSON.stringify(fsErr, null, 2));

                  return callback();
                });
              }
            });
          },
          function (err) {
            if (err) {
              throw err;
            }
          }
      );
    }

    return{
      setConfig: setConfig,
      setConfigFromFile: setConfigFromFile,
      setSender: setSender,
      setReceiver: setReceiver,
      setCcReceiver: setCcReceiver,
      setBccReceiver: setBccReceiver,
      setSubject: setSubject,
      setContent: setContent,
      sendEmail: sendEmail,
      sendEmailBatch: sendEmailBatch
    }
  }

  module.exports = awsSesMail;
}());
