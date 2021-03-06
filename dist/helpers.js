const time = 15000;
const getUserIndex = (clientId, users) => {
    // let userIndex;
    for (let i = 0; i < users.length; i++) {
        if (users[i].id === clientId) {
            return i;
        }
    }
    return null;
};
const restartDisconnectTimer = (user, cb) => {
    if (user && user.timer) {
        clearTimeout(user.timer);
    }
    user.timer = setTimeout(() => {
        cb();
    }, time);
};
exports.utils = { time, getUserIndex, restartDisconnectTimer };
//# sourceMappingURL=helpers.js.map