const getUserIndex = (clientId, users) => {
    for (let i = 0; i < users.length; i += 1) {
        if (users[i].id === clientId) {
            return i;
        }
    }
    return null;
};
const restartDisconnectTimer = (user, cb, time = 60000) => {
    if (user && user.timer) {
        clearTimeout(user.timer);
    }
    return setTimeout(() => {
        cb();
    }, time);
};
exports.getUserIndex = getUserIndex;
exports.restartDisconnectTimer = restartDisconnectTimer;
//# sourceMappingURL=utils.js.map