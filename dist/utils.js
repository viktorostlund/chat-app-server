const getUserIndex = (clientId, users) => {
    // let userIndex;
    for (let i = 0; i < users.length; i++) {
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
    user.timer = setTimeout(() => {
        cb();
    }, time);
};
exports.getUserIndex = getUserIndex;
exports.restartDisconnectTimer = restartDisconnectTimer;
//# sourceMappingURL=utils.js.map