const getUserIndex = (clientId, users) => {
    // let userIndex;
    for (let i = 0; i < users.length; i++) {
        if (users[i].id === clientId) {
            return i;
        }
    }
    return null;
};
exports.getUserIndex = getUserIndex;
//# sourceMappingURL=helpers.js.map