function getUUID() {
  let uuid = "";
  for (i = 0; i < 8; i++)
    uuid += Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return uuid;
}
class TidyChat {
  get version() {
    return "tidychat-js-1.0";
  }
  get bearer() {
    return null;
  }
  get host() {
    let a = "wss://tidy.chat/?version=" + this.version;
    if (this.bearer !== null) {
      a += "&access_token=" + this.bearer.replace(/\+/g, '%2B');
    }
    return a;
  }
  get socket() {
    return this._socket;
  }
  set socket(socket) {
    this._socket = socket;
  }
  constructor() {
    window.onbeforeunload = this.close();
    setInterval(this.connect.bind(this), 1000);
  }
  connect() {
    if (this.socket !== undefined) {
      switch (this.socket.readyState) {
        case this.socket.CLOSED:
          break;
        default:
          return;
      }
    }
    this.socket = new WebSocket(this.host);
    this.socket.onopen = function() {
      window.parent.document.dispatchEvent(new CustomEvent('tcConnect', {}));
    };
    this.socket.onmessage = function(event) {
      if (!event.data) return;
      let packet = JSON.parse(event.data);
      let eventToDispatch = new CustomEvent('tcReceive', {
        bubbles: true,
        detail: packet
      });
      window.parent.document.dispatchEvent(eventToDispatch);
    };
    this.socket.onerror = function(event) {
      let eventToDispatch = new CustomEvent('tcError', {
        bubbles: true,
        detail: event.code
      });
      window.parent.document.dispatchEvent(eventToDispatch);
    };
    this.socket.onclose = function(event) {
      window.parent.document.dispatchEvent(new CustomEvent('tcDisconnect', {}));
    };
  }
  close() {
    if (this.socket !== undefined) {
      switch (this.socket.readyState) {
        case this.socket.CLOSED:
          return;
      }
      this.socket.close(1001);
    }
  }
  send(json) {
    if (this.socket === undefined) {
      return false;
    }
    switch (this.socket.readyState) {
      case this.socket.CLOSED:
      case this.socket.CLOSING:
      case this.socket.CONNECTING:
        return false;
    }
    let jsonString = JSON.stringify(json);
    this.socket.send(jsonString);
    let eventToDispatch = new CustomEvent('tcSend', {
      bubbles: true,
      detail: json
    });
    window.parent.document.dispatchEvent(eventToDispatch);
    return true;
  }
  check_message(authorUID, message) {
    let messageUID = getUUID();
    let packet = {
      "id": 0x00,
      "authorUID": authorUID,
      "chatMessage": {
        "messageUID": messageUID,
        "message": message
      }
    };
    this.send(packet);
  }
  get_user_data(authorUID) {
    let packet = {
      "id": 0x01,
      "authorUID": authorUID
    };
    this.send(packet);
  }
  delete_user_data(authorUID) {
    let packet = {
      "id": 0x02,
      "authorUID": authorUID
    };
    this.send(packet);
  }
}