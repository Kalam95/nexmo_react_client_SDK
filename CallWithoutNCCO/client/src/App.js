import logo from './logo.svg';
import './App.css';
import axios from "axios"
import React, { useState, useEffect } from 'react';
import LoggedinPage from './LoggedinPage';



const BACKEND_URL = `http://localhost:5001/`;
const Clock = ({time}) => <p>this is the current time: {time}</p>

const LoginForm = ({placeholder, onSubmit}) => {
  console.log("my login componnet") 
 return (
    <div className="App">
      <form onSubmit={onSubmit}>
        <h5>{placeholder}</h5>
        <input type="text"/>
        <button submit="submit">Login</button>
      </form>
    </div>
  )
}

function App() {
  const [username, setUsername] = useState("")
  const [loginStatus, setLoginStatus] = useState("Not started")
  const [loginInfo, setLoginInfo] = useState(null)
  useEffect(() => {
    console.log('new Username', username)
 }, [username])

  const onLogin = async (event) => {
    setLoginStatus("please wait, we are logining in...")
    try {
     event.preventDefault();
     const username = event.target[0].value
      setUsername(username)
      const response = await axios({
      url: `${BACKEND_URL}api/login`,
      method: "post",
      data: {
        username: username
      }}
    )
    setLoginInfo(response.data)
   } catch (error){
    setLoginStatus("Login unsuccessful")
     setLoginStatus(error.toString())
   }
  } 

  const onSubscribe = async (event) => {
    setLoginStatus("please wait, we are logining in...")
    try {
     event.preventDefault();
     const username = event.target[0].value
      setUsername(username)
      console.log("login event", event)
      console.log("login username", username)
      const response = await axios({
      url: `${BACKEND_URL}api/subscribe`,
      method: "post",
      data: {
        username: username
      }}
    )
    console.log(`subscribe data: ${response.data.token}`)
     setLoginStatus("subscribe successfull, you can now login")
   } catch (error){
     setLoginStatus(error.toString())
   }
  } 
  const LoginPage = ({onLogin, onSubscribe}) => {
    return (
      <div>
      <LoginForm placeholder="Enter username" onSubmit={onLogin}/>
      <LoginForm placeholder="or Signup here" onSubmit={onSubscribe}/>
      {<h3>login status {loginStatus}</h3>}
      {loginStatus.token && <h3>login token is {loginStatus.token}</h3>}
      </div>
    )
  }

  return (
    <div className="App">
      {loginInfo && <LoggedinPage loginInfo={loginInfo}></LoggedinPage>}
      {!loginInfo && <LoginPage onLogin={onLogin} onSubscribe={onSubscribe}></LoginPage>}
    </div>
  );
  
}



export default App;
