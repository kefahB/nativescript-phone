// @ts-check
/// <reference path="./node_modules/tns-platform-declarations/android.d.ts" />

const app = require('@nativescript/core/application');
const permissions = require('nativescript-permissions');

export function dial(telNum, prompt) {
  try {
    if (prompt === void 0) {
      prompt = true;
    }
    var intentType = android.content.Intent.ACTION_DIAL;

    if (prompt === false) {
      // check permissions
      var hasPerms = permissions.hasPermission(
        android.Manifest.permission.CALL_PHONE
      );
      if (hasPerms === false) {
        return 'Application does not have permission to call directly.';
      }

      intentType = android.content.Intent.ACTION_CALL;
    }

    var intent = new android.content.Intent(intentType);

    // support for ussd numbers with # on android
    telNum = telNum.replace('#', encodeURIComponent('#'));

    intent.setData(android.net.Uri.parse('tel:' + telNum));

    app.android.foregroundActivity.startActivity(intent);

    return true;
  } catch (ex) {
    console.log(ex);
    return ex;
  }
}

export function sms(smsNum, messageText) {
  return new Promise(function (resolve, reject) {
    if (!Array.isArray(smsNum)) {
      smsNum = [smsNum];
    }

    try {
      var SEND_SMS = 1001;
      var intent = new android.content.Intent(
        android.content.Intent.ACTION_VIEW
      );
      intent.putExtra('sms_body', messageText);
      intent.setType('vnd.android-dir/mms-sms');
      intent.setData(android.net.Uri.parse('sms:' + smsNum.join(';')));

      app.android.foregroundActivity.startActivityForResult(intent, SEND_SMS);

      var activity =
        app.android.foregroundActivity || app.android.startActivity;

      var previousResult = activity.onActivityResult;

      activity.onActivityResult = function (requestCode, resultCode, data) {
        activity.onActivityResult = previousResult;
        // Check which request we're responding to
        if (requestCode === SEND_SMS) {
          if (resultCode === android.app.Activity.RESULT_OK) {
            return resolve({
              response: 'success',
            });
          } else if (resultCode === android.app.Activity.RESULT_CANCELED) {
            return resolve({
              response: 'cancelled',
            });
          } else {
            return resolve({
              response: 'failed',
            });
          }
        } else {
          // activity result not handled by this plugin
          if (typeof previousResult === 'function') {
            previousResult(requestCode, resultCode, data); // pass to previous result handler
          }
        }
      };
    } catch (ex) {
      reject(ex.toString());
    }
  });
}

export function requestCallPermission(explanation) {
  return permissions.requestPermission(
    android.Manifest.permission.CALL_PHONE,
    explanation
  );
}

function hasCallPermission() {
  return permissions.hasPermission(android.Manifest.permission.CALL_PHONE);
}
