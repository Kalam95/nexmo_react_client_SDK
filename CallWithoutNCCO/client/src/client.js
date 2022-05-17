import axios from "axios";
import React, { useState, useEffect } from "react";

const socket_io = require('socket.io-client');

const logger = {
    info: (...args) => {
        console.log(...args)
    },
    error: (...args) => {
        console.error(...args)
    }, 
}

export default function startClient() {
    console.log("Client started")
    let sessionData = {}
    let onEventCallbacks = []
    let onRequestStartCallbacks = []
    let onRequestEndCallbacks = []

    const onEvent = (callback) => {
        const id = "32432431e3d32rd"//uuidv4()
        onEventCallbacks.push({
            id,
            callback
        }) 
        return id
    }
    const onRequestStart = (callback) => {
        const id = "32432431e3d32rd"
        onRequestStartCallbacks.push({
            id,
            callback
        })
        return id
    }

    const onRequestEnd = (callback) => {
        const id = "32432431e3d32rd"
        onRequestEndCallbacks.push({
            id,
            callback
        })
        return id
    }

    const getSessionData = () => sessionData

    const request = async (request) => {
        const { token, session_id, cs_url} = sessionData 
        try {
            request.headers = {
                'Authorization': `Bearer ${token}`,
                // 'x-nexmo-sessionid': session_id
            }
            
            request.url = `${cs_url}${request.url}`
            if(request.data)
                request.data = {
                    originating_session: session_id,
                    ...request.data
                }

            logger.info({ request }, "CSClient request -> ")
            onRequestStartCallbacks
                .forEach(({ callback }) => callback({ request }))
            const axiosResponse = await axios(request)
            onRequestEndCallbacks
                .forEach(({ callback }) => callback({
                    request,
                    response: {
                        data: axiosResponse.data,
                        status: axiosResponse.status,
                        headers: axiosResponse.headers
                    }
                }))

            logger.info({ request, data: axiosResponse.data, status: axiosResponse.status }, "CSClient reponse <-")
            return axiosResponse
        } catch (error) {
            const requestError = {
                request: request
            }
            if (error.response) {
                requestError.response = {
                    data: error.response.data,
                    status: error.response.status,
                    headers: error.response.headers,
                }
            }
            if (error.message) {
                requestError.message = error.message
            }

            logger.error({ ...requestError }, "CSClient error <-")
            onRequestEndCallbacks
                .forEach(({ callback }) => callback(requestError))

            throw error;
        }
    }

    const connect = async ({token, cs_url, ws_url}) => new Promise(resolve => {

        const cleint = socket_io.connect(ws_url, {
            path: "/rtc",
            transports: ['websocket'],
            forceNew: false,
            reconnection: false,
            autoConnect: true,
        });

        require('socketio-wildcard')(socket_io.Manager)(cleint)

        cleint.on('connect', function () {

            cleint.on('*', function (packet) {
                const [type, body] = packet.data;
                const event = { type, ...body };
                // onEventCallback(event)
                onEventCallbacks
                    .forEach(({callback}) => callback(event) )

            })

            const loginData = {
                "device_id": "666666666666666", // TODO: use https://github.com/Valve/fingerprintjs2
                "device_type": "js",
                token
            }

            cleint.emit("session:login", { body: loginData} )
        
            cleint.on("session:success", (event) => {
                const {id, name, user_id} = event.body
                sessionData = {
                    session_id: id,
                    user_name: name,
                    user_id: user_id,
                    token,
                    cs_url, 
                    ws_url

                }
                resolve()

            })
        })
        
    });
    return {
        connect,
        request,
        getSessionData,
        onEvent,
        onRequestStart,
        onRequestEnd
    }
}