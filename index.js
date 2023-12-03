const express = require('express');
const app = express();

const port = process.env.PORT || 3000;


const http = require('http');
const io = require('socket.io');

const server = http.createServer();
const socketServer = io(server);
// Start the server and listen for incoming connections

let current_users = [];
let free = [];
let calling = [];
let connectedUsers = [];
let whoisConnectedwithWhom = [];


//showing demo records
app.get('/demo', (req, res) => {
    res.json([
        {
            id: '001',
            name: 'Smith',
            email: 'smith@gmail.com',
        },
        {
            id: '002',
            name: 'Samy',
            email: 'samy@gmail.com',
        },
        {
            id: '003',
            name: 'lily',
            email: 'lily@gmail.com',
        },
    ]);
});


socketServer.on('connection', (socket) => {
    console.log("********************************************************")
    console.log("connection", socket.id)


    // socket.onAny((event, data) => {
    //     console.log("socket onAny--event--> ", event);
    //     console.log("socket onAny--data--> ", data);
    //     console.log("socket.id onAny--event--> ", socket.id);


    //     /* console.log("----------------while----current_users-------------------"); */
    //     /* callingMethod(); */

    //     /* if (event == "bye" || event == "close" || event == "disconnect" || event == "leave") {
    //     } */
    // });

    //============================================================->============================================================->============================================================->

    socket.on(newUserKey, function (data) {
        var newMap = {
            'name': data['name'],
            'mobile_no': data['mobile_no'],
            'password': data['password'],
            'connection_id': data['connection_id'],
            'time': data['time'],
            'session_id': data['session_id'],
            'call_state': data['call_state'],
            'my_friends': data['my_friends'],
            'gender': data['gender'],
            'joinPref': data['joinPref'],
            'online_offline_status': data['online_offline_status'],
        };
        console.log("new----> ", newMap);
        ///Checks if Array already has user or new User
        const indexOFhasMatchingMobile = current_users.findIndex(obj => obj["mobile_no"] === data['mobile_no'] && obj["password"] === data['password']);
        if (indexOFhasMatchingMobile > -1) {
            current_users[indexOFhasMatchingMobile]['connection_id'] = data['connection_id'];
            current_users[indexOFhasMatchingMobile]['online_offline_status'] = data['online_offline_status'];
        } else {
            current_users.push(newMap);
        }

        socketServer.emit(peersKey, current_users);
        console.log("current_users.length----> ", current_users.length);
        /* for (let index = 0; index < current_users.length; index++) {
            let freinds_list = current_users[index]['my_friends'];
            let my_freinds_list = newMap['my_friends'];
            console.log("freinds_list----> ", freinds_list);
            console.log("current_users[index]['connection_id'] 11----> ", current_users[index]['connection_id']);
            for (let indx = 0; indx < freinds_list.length; indx++) {
                if (freinds_list[indx]['name'] == newMap['name']) {
                    freinds_list[indx]['online_offline_status'] = true;
                    console.log("freinds_list----> ", freinds_list);
                }
            }
            for (let indx = 0; indx < my_freinds_list.length; indx++) {
                if (my_freinds_list[indx]['name'] == current_users[index]['name']) {
                    my_freinds_list[indx]['online_offline_status'] = true;
                    console.log("my_freinds_list----> ", my_freinds_list);
                }
            }
            socketServer.to(current_users[index]['connection_id']).emit("onFriendUpdate", freinds_list);
        } */
    });

    //============================================================->============================================================->============================================================->

    socket.on(disconnectKey, function (data) {
         console.log("disconnect---============================================================-> ", data);
        console.log("socket.id disconnect--event--> ", socket.id);
        for (let index = 0; index < current_users.length; index++) {
            console.log('disconnect Test n:', 11111111);
            var sessionId = current_users[index]['session_id'];
            var ids = sessionId.split('^');
            console.log("ids", ids);
            console.log("ids", ids[0]);
            console.log("ids", ids[1]);
            if (ids[0] == socket.id || ids[1] == socket.id) {
                console.log('disconnect Test n:', 2222222);
                /* var sessionId = current_users[index]['session_id'];
                var ids = sessionId.split('^');
                console.log("ids", ids);
                console.log("ids", ids[0]);
                console.log("ids", ids[1]); */
                if (socket.id == ids[0]) {
                    console.log('disconnect Test n:', 3333333);
                    var newByeMap0 = {
                        'session_id': sessionId,
                        'from': socket.id,
                        'peer1': ids[0],
                        'peer2': ids[1],
                    };
                    socketServer.to(ids[1]).emit("bye", newByeMap0);
                    console.log("newByeMap0----> ", newByeMap0);
                }
                if (socket.id == ids[1]) {
                    console.log('disconnect Test n:', 4444444);
                    var newByeMap1 = {
                        'session_id': sessionId,
                        'from': socket.id,
                        'peer1': ids[0],
                        'peer2': ids[1],
                    };
                    socketServer.to(ids[0]).emit("bye", newByeMap1);
                    console.log("newByeMap1----> ", newByeMap1);
                }
            }
            console.log('disconnect Test n:', 5555555);

        }
        removeFromCurrentUserArrey(socket.id);
        onDisconnectRemoveFromFreeCallingConnected(socket.id);
    });

    //============================================================->============================================================->============================================================->

    socket.on(chatRoomKey, function (data) {
        console.log("chatRoom----> ", data);
        const index1User = current_users.findIndex(obj => obj["mobile_no"] === data["my_id"]);
        const index2User = current_users.findIndex(obj => obj["mobile_no"] === data["opponent_id"]);
        // console.log("index1User----> ", index1User);
        // console.log("index2User----> ", index2User);
        const chatRoomId = data['chat_room_id'];
        if (index1User > -1) {
            current_users[index1User].chats ??= []; // create 'chats' Array if it's undefined
            const index1OfChatRoom = current_users[index1User].chats.findIndex(room => {
                const roomId = room['chat_room_id'];
                return roomId === chatRoomId || roomId.split('^').reverse().join('^') === chatRoomId;
            });
            if (index1OfChatRoom > -1) {
                const uniqueArray = [...new Set(current_users[index1User].chats[index1OfChatRoom].massages)];
                socketServer.to(current_users[index1User]['connection_id']).emit(messageKey, uniqueArray);
                console.log("chatRoom-exist-with-id--index1User-> ", data['chat_room_id']);
            } else {
                current_users[index1User].chats.push(data);
                console.log("chatRoom-not-exist-with-id--index1User-> ", data['chat_room_id']);
            }
        }
        if (index2User > -1) {
            current_users[index2User].chats ??= []; // create 'chats' Array if it's undefined
            const index2OfChatRoom = current_users[index2User].chats.findIndex(room => {
                const roomId = room['chat_room_id'];
                return roomId === chatRoomId || roomId.split('^').reverse().join('^') === chatRoomId;
            });
            /*  const chatRoomExists = current_users[index2User].chats.some(room => {
                 const roomId = room['chat_room_id'];
                 return roomId === chatRoomId || roomId.split('^').reverse().join('^') === chatRoomId;
             }); */
            if (index2OfChatRoom > -1) {
                const uniqueArray = [...new Set(current_users[index2User].chats[index2OfChatRoom].massages)];
                socketServer.to(current_users[index2User]['connection_id']).emit(messageKey, uniqueArray);
                console.log("chatRoom-exist-with-id--index2User-> ", data['chat_room_id']);
            } else {
                const newChats = { ...data, opponent_id: current_users[index1User]?.mobile_no };
                console.log("newChats----> ", newChats);
                current_users[index2User].chats.push(newChats);
                console.log("chatRoom-not-exist-with-id--index2User-> ", data['chat_room_id']);
            }

        }
        // console.log("current_users----> ", current_users);
    });

    //============================================================->============================================================->============================================================->

    socket.on(messageKey, function (data) {
        console.log("chatRoom----> ", data);
        const index1User = current_users.findIndex(obj => obj["mobile_no"] === data["from"]);
        const index2User = current_users.findIndex(obj => obj["mobile_no"] === data["to"]);
        console.log("index1User----> ", index1User);
        console.log("index2User----> ", index2User);
        const chatRoomId = data['chat_room_id'];
        if (index1User > -1) {
            current_users[index1User].chats ??= []; // create 'chats' object if it's undefined
            const index1OfChatRoom = current_users[index1User].chats.findIndex(room => {
                const roomId = room['chat_room_id'];
                return roomId === chatRoomId || roomId.split('^').reverse().join('^') === chatRoomId;
            });
            if (index1OfChatRoom > -1) {
                current_users[index1User].chats[index1OfChatRoom].massages ??= []; // create 'massages' array if it's undefined
                current_users[index1User].chats[index1OfChatRoom].massages.push(data); // add new data to the 'massages' array
                const uniqueArray = [...new Set(current_users[index1User].chats[index1OfChatRoom].massages)];
                socketServer.to(current_users[index1User]['connection_id']).emit(messageKey, uniqueArray);
                console.log("index1OfChatRoom----> ", index1OfChatRoom);
            } else if (current_users[index1User].chats.isEmpty()) {
                current_users[index1User].chats[0].massages ??= [];
                current_users[index1User].chats[0].massages.push(data);
                const uniqueArray = [...new Set(current_users[index1User].chats[0].massages)];
                socketServer.to(current_users[index1User]['connection_id']).emit(messageKey, uniqueArray);
                // console.log("current_users[index1User].chats.isEmpty()----> ", current_users[index1User].chats.isEmpty());
            }
            // console.log("name----> ", current_users[index1User].name);
        }
        if (index2User > -1) {
            current_users[index2User].chats ??= []; // create 'chats' object if it's undefined
            const index2OfChatRoom = current_users[index2User].chats.findIndex(room => {
                const roomId = room['chat_room_id'];
                return roomId === chatRoomId || roomId.split('^').reverse().join('^') === chatRoomId;
            });
            if (index2OfChatRoom > -1) {
                current_users[index2User].chats[index2OfChatRoom].massages ??= []; // create 'massages' array if it's undefined
                current_users[index2User].chats[index2OfChatRoom].massages.push(data); // add new data to the 'massages' array
                const uniqueArray = [...new Set(current_users[index2User].chats[index2OfChatRoom].massages)];
                socketServer.to(current_users[index2User]['connection_id']).emit(messageKey, uniqueArray);
            } else if (current_users[index2User].chats.isEmpty()) {
                current_users[index2User].chats[0].massages ??= [];
                current_users[index2User].chats[0].massages.push(data);
                const uniqueArray = [...new Set(current_users[index2User].chats[0].massages)];
                socketServer.to(current_users[index2User]['connection_id']).emit(messageKey, uniqueArray);
            }
            // console.log("name----> ", current_users[index2User].name);
        }
        // console.log("current_users----> ", current_users);
    });

    //============================================================->============================================================->============================================================->

    socket.on(offerKey, function (data) {
        /* console.log("offer----> ", data); */
        socketServer.to(data['to']).emit(offerKey, data);
        updateSessionID(socket, data);
        maintainArraysWhileCallConnection();
    });

    socket.on(answerKey, function (data) {
        /* console.log("answer----> ", data); */
        socketServer.to(data['to']).emit(answerKey, data);
        updateSessionID(socket, data);
    });

    socket.on(candidateKey, function (data) {
        /* console.log("candidate----> ", data); */
        socketServer.to(data['to']).emit(candidateKey, data);
    });

    socket.on(callStateKey, function (data) {
        console.log("call_state----> ", data);
        for (let index = 0; index < current_users.length; index++) {
            if (current_users[index]['connection_id'] == socket.id) {
                current_users[index]['call_state'] = data['call_state'];
            }
        }
        forCallStateByeToNoN();
        if (data['call_state'] == "CallStateConnected" || data['call_state'] == "CallStateRinging") {
            connectedUsers.push(socket.id);
            removeFromCalling();
        }
        console.log("connectedUsers----> ", connectedUsers);
        console.log("current_users----> ", current_users);
    });

    socket.on(closeKey, function (data) {
        console.log("close----> ", data);
        socketServer.to(data['peerId']).emit(leaveKey, data['peerId']);
        console.log("data['from']----> ", data['from']);
        removeFromCurrentUserArrey(data['from']);
    });

    socket.on(byeKey, function (data) {
        console.log("bye----> ", data);
        socketServer.to(data['peer1']).emit(byeKey, data);
        socketServer.to(data['peer2']).emit(byeKey, data);
    });
})

function updateSessionID(socket, data) {
    for (let index = 0; index < current_users.length; index++) {
        if (current_users[index]['session_id'] == "NON" && current_users[index]['connection_id'] == socket.id) {
            current_users[index]['session_id'] = data['session_id'];
        }
    }
}

function findInCurrentUserArrayIFNOtFoundThenRemoveMethod(anyArray) {
    for (let i = 0; i < anyArray.length; i++) {
        // checkContainsbyKeyValue(current_users, 'connection_id', anyArray[i])
        const indexofMatching = current_users.findIndex(obj => obj['connection_id'] == anyArray[i]);
        if (indexofMatching == -1) {
            const indexofRemoving = anyArray.findIndex(obj => obj == anyArray[i]);
            try {
                if (indexofRemoving > -1) {
                    console.log("splice--anyArray--> ", 'anyArray');
                    anyArray.splice(indexofRemoving, 1);
                }
                /* free.splice(calling[i]); */
            } catch (e) {
                console.log("removeFromanyArray--errror----> ", e);
            }
            console.log("anyArray----> ", free);
        }

    }
}

function onDisconnectRemoveFromFreeCallingConnected(socketID) {
    removeFromArreyById(free, socketID, "free");
    removeFromArreyById(calling, socketID, "calling");
    removeFromArreyById(connectedUsers, socketID, "connectedUsers");
}



function maintainArraysWhileCallConnection() {
    /* try {
        if (free.length > 1) {
            // do {
                // if (free.length % 2 !== 0 && free.length == 1) break;
                // const indexofRemoving = free.findIndex(obj => obj["gender"] == Male);
                console.log('free[0]', free[0]);
                console.log('free[1]', free[1]);
                var toFromMap = {
                    'from': free[0],
                    'to': free[1],
                };
                whoisConnectedwithWhom.push(toFromMap);
                calling.push(free[0]);
                calling.push(free[1]);
                socketServer.to(free[0]).emit("call_id", free[1]);
                // socketServer.to(free[0]).emit("call_id", free[1]);//TODO
                removeFromFree();
            // } while (free.length > 1);
        }
    } catch (error) {
        console.log("error----> ", error);
    } */
    removeFromFree();
    if (free.length > 0) {
        // console.log("free--before--filter--> ", free);
        free = free.filter((x, i) => i === free.indexOf(x));
        // console.log("free--after--filter--> ", free);
    }
    if (calling.length > 0) {
        // console.log("calling--before--filter--> ", calling);
        calling = calling.filter((x, i) => i === calling.indexOf(x));
        // console.log("calling--after--filter--> ", calling);
    }
    if (connectedUsers.length > 0) {
        // console.log("connectedUsers--before--filter--> ", connectedUsers);
        connectedUsers = connectedUsers.filter((x, i) => i === connectedUsers.indexOf(x));
        // console.log("connectedUsers--after--filter--> ", connectedUsers);
    }
    if (current_users.length > 0) {
        // console.log("current_users--before--filter--> ", current_users);
        current_users = current_users.filter((x, i) => i === current_users.indexOf(x));
        // console.log("current_users--after--filter--> ", current_users);
    }
    findInCurrentUserArrayIFNOtFoundThenRemoveMethod(free);
    findInCurrentUserArrayIFNOtFoundThenRemoveMethod(calling);
    findInCurrentUserArrayIFNOtFoundThenRemoveMethod(connectedUsers);
    console.log('free aa', free);
    console.log('calling aa', calling);
    console.log('connectedUsers aa', connectedUsers);
    console.log('current_users aa', current_users);
}

function forCallStateByeToNoN() {
    for (let index = 0; index < current_users.length; index++) {
        try {
            if (current_users[index]['call_state'] == "CallStateBye") {
                console.log("forCallStateByeToNoN--users[index]----> ", current_users[index]);
                current_users[index]['call_state'] = "NON";
                pushingNewToFreeArray();
            }
        } catch (error) {
            console.log("forCallStateByeToNoN--error----> ", error);
        }
    }
    console.log("forCallStateByeToNoN--current_users----> ", current_users);

}



function pushingNewToFreeArray() {
    for (let index = 0; index < current_users.length; index++) {
        if (current_users[index]['call_state'] == 'NON') {
            free.push(current_users[index]['connection_id']);
        }
    }
    if (free.length > 0) {
        console.log("free--before--filter--> ", free);
        free = free.filter((x, i) => i === free.indexOf(x));
        console.log("free--after--filter--> ", free);
    }

}

function removeFromArreyById(arrey, id, arreyName) {
    const index = arrey.findIndex(obj => obj == id);
    console.log("index----> ", index);
    if (index > -1) {
        console.log("splice----> ", 'splice');
        arrey.splice(index, 1);
    }
    console.log("----removeArrey--arreyName--> ", arreyName);
    console.log("----removeArrey----> ", arrey);
}

function removeFromFree() {
    for (let i = 0; i < calling.length; i++) {
        if (free.includes(calling[i])) {
            const indexofRemoving = free.findIndex(obj => obj == calling[i]);
            try {
                if (indexofRemoving > -1) {
                    console.log("splice--free--> ", 'splice');
                    free.splice(indexofRemoving, 1);
                }
                /* free.splice(calling[i]); */
            } catch (e) {
                console.log("removeFromFree--errror----> ", e);
            }
            console.log("FREE----> ", free);
        }
    }
}

function removeFromCalling() {
    for (let i = 0; i < connectedUsers.length; i++) {
        if (calling.includes(connectedUsers[i])) {
            const indexofRemoving = calling.findIndex(obj => obj == connectedUsers[i]);
            try {
                if (indexofRemoving > -1) {
                    console.log("splice--calling--> ", 'splice');
                    calling.splice(indexofRemoving, 1);
                }
                /* free.splice(calling[i]); */
            } catch (e) {
                console.log("removeFromCalling--errror----> ", e);
            }
            console.log("calling----> ", calling);
        }
    }
}

function removeFromCurrentUserArrey(id) {
    const index = current_users.findIndex(obj => obj["connection_id"] == id);
    console.log("index----> ", index);
    /* for (let indx = 0; indx < current_users.length; indx++) {
        let freinds_list = current_users[indx]['my_friends'];
        console.log("freinds_list----> ", freinds_list);
        console.log("current_users[index]['connection_id'] 11----> ", current_users[index]['name']);
        for (let indx2 = 0; indx2 < freinds_list.length; indx2++) {
            if (freinds_list[indx2]['name'] == current_users[index]['name']) {
                freinds_list[indx2]['online_offline_status'] = false;
                console.log("freinds_list----> ", freinds_list);
            }
        }
        socketServer.to(current_users[indx]['connection_id']).emit("onFriendUpdate", freinds_list);
    } */
    if (index > -1) {
        console.log("splice----> ", 'splice');
        current_users[index]['online_offline_status'] = false;
    }
    // console.log("current_users----> ", current_users);
    socketServer.emit(peersKey, current_users);
}

///EventNameKeys
const newUserKey = "newUser";
const peersKey = "peers";
const chatRoomKey = "chatroom";
const disconnectKey = "disconnect";
const messageKey = "message";
  //WebRTC Keys
const offerKey = "offer"; 
const answerKey = "answer"; 
const candidateKey = "candidate"; 
const callStateKey = "call_state"; 
const closeKey = "close";
const leaveKey = "leave";
const byeKey = "bye";

const MsgStatus = Object.freeze({
    sending: 0,
    sent: 1,
    received: 2,
    seen: 3
});



// Define the extension function
Array.prototype.isEmpty = function () {
    return this.length === 0;
};


server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
