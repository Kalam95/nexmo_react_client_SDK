
import React, { useState, useEffect } from 'react';

export default function Conversation(props) {
    const { conversation_id, csClient, user, member_id } = props
    const [name, setName] = useState("Conversation Details")
    const [sendStatus, setSendStatus] = useState(null)
    const [conversationStatus, setConversationStatus] = useState(null)
    const [messages, setMessages] = useState([])
    const [members, setMembers] = useState([])

    const messageReceived = (event) => {
        console.log("event received: ", event)
        let messageList = messages
        console.log("current list is",messages)
        messageList.push({ user: event._embedded.from_user, body: event.body })
        setMessages(messageList)
    }

    useEffect(() => {
        csClient.onMessage(messageReceived);
        getConversations()
    }, [props.conversation_id])

    useEffect(() => {
        getConversationsMembers()
    }, [props.conversation_id])

    const onSubmit = async (event) => {
        event.preventDefault();
        const message = event.target[0].value
        if (!message.replace(/\s/g, '')) {
            setSendStatus("cannot send empty message")
            return
        }
        setSendStatus("sending")
        try {
            const sendResponse = await csClient.request({
                url: `/v0.3/conversations/${conversation_id}/events`,
                method: "post",
                data: {
                    type: "text",
                    body: {
                        "text": message
                    },
                    from: member_id
                }

            })
            console.log("message sent", sendResponse)
            setSendStatus(null)
        } catch (error) {
            console.log(error)
            setSendStatus("there has been and error in sending:", error.data)
        }
    }

    const getConversations = async () => {
        try {
            const convRes = await csClient.request({
                url: `/v0.3/conversations/${conversation_id}/events`,
                method: "get",
                data: {
                    "page_size": "100",
                    "order": "asc",
                    "conversation_id": conversation_id
                }
            })
            let messagesList = convRes.data._embedded.events.filter(item => {
                return item.type === "text" || item.type === "message"
            }).map(item => {
                return { body: item.body, user: item._embedded.from_user }
            })
            if (!messagesList.length) {
                setConversationStatus("no messages, start the conversation")
                return
            }
            setConversationStatus(null)
            console.log("data is : ", convRes.data)
            console.log("message are", messagesList)
            setMessages(messagesList)
        } catch (error) {
            setConversationStatus(error.data || error.toString() || error.json() || error.JSON())
        }
    }

    const getConversationsMembers = async () => {
        try {
            const membersData = await csClient.request({
                url: `/v0.3/conversations/${conversation_id}/members`,
                method: "get",
                data: {
                    "page_size": "100",
                    "order": "asc"
                }
            })
            console.log("members: ", membersData.data)
            setMembers(membersData.data._embedded.members)
        } catch (error) {
            console.log("error:", error)
        }
    }

    const getMembers = () => {
        return members.filter(item => {
            return item.state === "JOINED"
        }).map(item => {
            return item._embedded.user.name
        }).join(", ")
    }

    const getMessageList = () => (
            messages.map((item, index) => {                
                      return (<div key={index}>By {item.user.name}: {item.body.text} </div>)
                    })
    )
    return (
        <div className="App">
            <h2>{name}</h2>
            <label style={{ fontWeight: "bold" }}>Members are: </label>
            {members && getMembers()}
            <br /><br />
            <form onSubmit={onSubmit}>
                <input type="text" />
                <button submit="submit">send</button>
                <br />
                <br></br>
                {sendStatus && <label>{sendStatus}</label>}
            </form>
            {messages && <ul key="unique">{getMessageList()}</ul>}
            {conversationStatus && <label>{conversationStatus}</label>}
        </div>
    );
}

