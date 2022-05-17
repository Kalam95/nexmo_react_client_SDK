import startClient from './client';
import React, { useState, useEffect } from 'react';

const csClient = startClient()

function useCSClientEvents(csClient) {

    const [event, setEvent] = useState(null)

    const setLastEvent = (clientEvent) => {
        setEvent(clientEvent)
    }

    useEffect(() => {
        csClient.onEvent(setLastEvent)
        csClient.onRequestStart(setLastEvent)
        csClient.onRequestEnd(setLastEvent)
    })

    return event
}

function LoginPage(props) {
    const [conversationStatus, setConversationStatus] = useState(null)
    const [conversationList, setConversationList] = useState(null)

    const [eventsHistory, setEvents] = useState([])
    const lastCSClientEvent = useCSClientEvents(csClient)



    useEffect(() => {
        const { token, cs_url, ws_url } = props.loginInfo
        csClient.connect({ token, cs_url, ws_url })
    }, [props.loginInfo])

    useEffect(() => {

        const appendHistory = (clientEvent) => {
            if (clientEvent)
                setEvents(eventsHistory => [...eventsHistory, clientEvent])
        }

        appendHistory(lastCSClientEvent)

    }, [lastCSClientEvent])

    const onSubmit = async (event) => {
        event.preventDefault();
        const name = event.target[0].value
        const displayName = event.target[1].value
        setConversationStatus(!name ? "Please enter a valid name" : "")
        const convRes = await csClient.request({
            url: `/v0.3/conversations`,
            method: "post",
            data: {
                "name": name,
                "display_name": displayName
            }
        })
        const response = await csClient.request({
            url: `/v0.3/conversations/${convRes.data.id}/members`,
            method: "post",
            data: {
                "state": "joined",
                "user": {
                    name: csClient.getSessionData().user_name,
                },
                "channel": {
                    "type": "app"
                }
            }
        })
        setConversationStatus("Conversation Created")
    }

    const getMyConversations = async () => {
        const listData = await csClient.request({
            url: `/v0.3/users/${csClient.getSessionData().user_id}/conversations?page_size=100`,
            method: "get",
            data: {}
        })
        setConversationList(listData.data._embedded.conversations);
    }

    const SimpleList = () => (
        <ul>
            {conversationList.map(item => {
                return <li key={item.id}>{item.name}</li>;
            })}
        </ul>
    );

    const onCleanHistoryClick = async () => {
        setEvents(() => [])
    }

    const EventTitle = ({ event, style }) => {
        let text = 'unknown'
        if (event.request && event.response) {
            text = '<- http response'
        } else if (event.request && !event.response) {
            text = '-> http request'
        } else if (event.type && event.body) {
            text = '<- ws event'
        }
    
    
        return (<h3 style={style} >{text}</h3>)
    }

    return (
        <div className="App">
            <form onSubmit={onSubmit}>
                <h2>Create conversation</h2>
                <label>Enter name for the conversation: </label>
                <input type="text" />
                <br />
                <label>Enter Display name the conversations</label>
                <input type="text" />
                <br />
                <button submit="submit">Create</button>
                <br />
                {conversationStatus && <label>{conversationStatus}</label>}
            </form>
            <br />
            <label>OR</label>
            <br />
            <h2>Get My Conversations</h2>
            <button onClick={getMyConversations}>Get My Conversations</button>
            {conversationList && SimpleList()}
            <br />
            <h2>History</h2>
            <div>
                <button onClick={onCleanHistoryClick} >Clean History</button>
            </div>
            {eventsHistory.map((evt, idx) => {
                return (
                    <div key={idx}  >
                        <EventTitle event={evt} style={{ padding: "5px", margin: "5px" }} />
                        <pre style={{ padding: "5px", margin: "5px", backgroundColor: "#ddd" }} >{JSON.stringify(evt, ' ', ' ')}</pre>
                    </div>
                )
            })}
        </div>
    );
};

export default LoginPage;