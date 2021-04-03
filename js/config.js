$(document).ready(function() {
  $('#config-input').prop('disabled', false).prop('placeholder', 'Paste your config.json contents here...');
  $('#config-input').on('change keyup paste', function() {
    $('#config-submit').prop('disabled', !$(this).val());
  });
  $('#config-submit').on('click', function(event) {
    $(this).addClass('hidden');
    $('#result').removeClass('hidden');

    logStep('Serializing');
    let serializedForm = $('form').serialize();

    logStep('Verifying JSON')
    let params = new URLSearchParams(serializedForm);
    let config = params.get('config');
    if (!config) {
      logError('No JSON provided');
      return;
    }
    config = config.trim();

    if (!config.startsWith('{') || !config.endsWith('}')) {
      logError('Malformed JSON');
      return;
    }

    logStep('Parsing JSON');
    let parsedConfig;
    try {
      parsedConfig = JSON.parse(config);
    } catch (error) {
      logError('Malformed JSON');
      return;
    }
    if (!parsedConfig || typeof parsedConfig !== 'object') {
      logError('Malformed JSON');
      return;
    }

    logStep('Submitting');
    $.ajax({
      url: 'https://bouncer.tidy.chat',
      type: 'PUT',
      data: {
        'config': JSON.stringify(parsedConfig)
      },
      success: function(data) {
        $('#config-submit').delay(5000).queue(function() {
          $(this).removeClass('hidden').dequeue();
        });
        $('#result').delay(5000).queue(function() {
          $(this).addClass('hidden').dequeue();
        });
        if (data.hasOwnProperty('bearer')) {
          logSuccess(data.bearer);
        } else {
          throw '{"error":"Bearer Not In Response"}';
        }
      },
      error: function(error) {
        logException(error);
      }
    });
  });
});

function logSuccess(bearer) {
  const element = $('#result');
  element.addClass('success')
    .html('<p>Success</p> <code>' + bearer + '</code>');
}

function logStep(step) {
  const element = $('#result');
  element.removeClass('success error exception')
    .html('<p>' + step + '...</p>');
}

function logError(error) {
  const element = $('#result');
  element.removeClass('success exception')
    .addClass('error')
    .html('<p>' + error + '</p>');
}

function logException(exception) {
  const element = $('#result');
  element.removeClass('success error')
    .addClass('exception')
    .html('<p>Something went wrong</p> <code>' + JSON.stringify(exception) + '</code>');
}