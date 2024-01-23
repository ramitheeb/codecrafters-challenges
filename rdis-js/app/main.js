const net = require("net");

const store = new Map();

const DELIMITER = "\r\n";
const COMMAND_INDEX = 2;

const server = net.createServer((connection) => {
  connection.on("data", (data) => {
    const response = handleCommand(data);

    if (response === null) {
      connection.write(`$-1${DELIMITER}`);
    } else {
      connection.write(`+${response}${DELIMITER}`);
    }
  });
});

server.listen(6379, "127.0.0.1");

function handleCommand(data) {
  const parsedData = data.toString().split(DELIMITER);
  const command = parsedData[COMMAND_INDEX].toLowerCase();
  const commandReceivedAt = Date.now();

  if (command === "ping") {
    return "PONG";
  }

  if (command === "echo") {
    return parsedData[4];
  }

  if (command === "set") {
    const ttlType = parsedData[8]?.toLowerCase();
    const ttl = parsedData[10];
    const expiryDate = commandReceivedAt + Number(ttl);

    store.set(parsedData[4], { value: parsedData[6], expiryDate, ttlType });
    return "OK";
  }

  if (command === "get") {
    const key = parsedData[4];
    const { expiryDate, value, ttlType } = store.get(key) ?? {};

    if (!ttlType) {
      return value;
    } else if (ttlType === "px" && expiryDate > commandReceivedAt) {
      return value;
    } else {
      store.delete(key);
      return null;
    }
  }
}
