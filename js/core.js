let tidyChat = new TidyChat();
let authorUID = undefined;
let messageStorage = {};

$(document).ready(function() {
  $("form").on("submit", function(event) {
    event.preventDefault();
    let input = $("input");
    let val = input.val().trim();
    if (val.length > 0) {
      tidyChat.check_message(authorUID, val.substring(0, 128));
    }
    input.val("");
  });
  $("#regenerate-uuid").on("click", function(event) {
    event.preventDefault();
    updateAuthorUID();
  });
  $("#request-data-get").on("click", function(event) {
    event.preventDefault();
    tidyChat.get_user_data(authorUID);
  });
  $("#request-data-delete").on("click", function(event) {
    event.preventDefault();
    tidyChat.delete_user_data(authorUID);
  });
  updateAuthorUID();
  setStatus("connect");
});

$(document).keydown(function() {
  let input = $("input");
  if (!input.is(":focus")) {
    input.focus();
  }
});

document.addEventListener("tcReceive", function(event) {
  let server = $("#server");
  if (event.detail.hasOwnProperty('chatMessage')) {
    let statusCodes = event.detail.chatMessage.statusCodes;
    let flagged = statusCodes.length > 0;

    server.addClass(flagged ? "bad" : "ok").removeClass(flagged ? "ok" : "bad").removeClass("info");
    log(event.detail, server);

    let messageUID = event.detail.chatMessage.messageUID;
    if (messageStorage[messageUID] !== undefined) {
      $("#response-time").text(Date.now() - messageStorage[messageUID]).css("visibility", "visible");
    }

    for (i = 200; i <= 205; i++) {
      $("#" + i).addClass(statusCodes.includes(i) ? "bad" : "ok").removeClass(statusCodes.includes(i) ? "ok" : "bad");
    }
  } else {
    server.addClass("info").removeClass("ok bad");
    log(event.detail, server);
  }
});

document.addEventListener("tcSend", function(event) {
  if (event.detail.hasOwnProperty('chatMessage')) {
    messageStorage[event.detail.chatMessage.messageUID] = Date.now();
  }

  $("#response-time").css("visibility", "hidden");

  for (i = 200; i <= 205; i++) {
    $("#" + i).removeClass("ok bad");
  }

  log(event.detail, $("#client"));
});

document.addEventListener("tcConnect", function(event) {
  setStatus("ok");
});

document.addEventListener("tcDisconnect", function(event) {
  setStatus("connect");
});

document.addEventListener("tcError", function(event) {
  setStatus("connect");
});

function setStatus(newStatus) {
  let status = $("#status");
  let input = $("input");
  switch (newStatus) {
    default:
      return;
    case "ok":
      status.addClass("fa-circle ok").removeClass("fa-circle-notch fa-spin connect");
      input.prop("disabled", false).prop("placeholder", "Connected! Try tidychat here!");
      break;
    case "connect":
      status.removeClass("fa-circle ok").addClass("fa-circle-notch fa-spin connect");
      input.prop("disabled", true).prop("placeholder", "Connecting...");
      input.val("");
      break;
  }
  status.removeClass("fa-exclamation-triangle bad");
}

function updateAuthorUID() {
  authorUID = getUUID();
  $("#author-uid").text(authorUID);
}

function log(json, block) {
  block.find("code").text(JSON.stringify(json, null, "  "));
  Prism.highlightAll();
}