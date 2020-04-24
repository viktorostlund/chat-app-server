interface User {
  userName: string;
  id: string;
  timer: number;
}

const getUserIndex = (clientId: string, users: Array<User>): number => {
  for (let i = 0; i < users.length; i += 1) {
    if (users[i].id === clientId) {
      return i;
    }
  }
  return null;
};

const restartDisconnectTimer = (
  user: User,
  cb: Function,
  time = 60000
): object => {
  if (user && user.timer) {
    clearTimeout(user.timer);
  }
  return setTimeout(() => {
    cb();
  }, time);
};

exports.getUserIndex = getUserIndex;
exports.restartDisconnectTimer = restartDisconnectTimer;
