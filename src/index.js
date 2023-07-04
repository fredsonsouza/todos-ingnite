const express = require("express")

const {v4: uuidv4} = require("uuid")

const app = express()
app.use(express.json())

const users = [];

function checkExistsUserAccount(request, response, next){
  const {username} = request.headers
  const user = users.find(user => user.username === username)

  if(!user){
    return response.status(400).json({error:"User not found!"})
  }

  request.user = user

  return next()
}

function checksCreateTodosUserAvailability(request, response,next){
 const {user} = request

  if(!user.pro && user.todos.length >=10){
    return response.status(403).json({error:"Task Limit Exceeded, make a pro plan!"})
  }

  return next()
}

function checksTodoExists(request, response, next){
  const {username} = request.headers
  const { v4: uuidv4, validate } = require("uuid");
  const {id} = request.params

  const userExists = users.find(user => user.username === username)
  const todoExists = userExists.todos.find(todo => id === todo.id)

  if(!userExists){
    return response.status(404).json({error:"User not found!"})
  }

  if(!todoExists){
    return response.status(404).json({error:"Todo not found!"})
  }
  if(!validate(id) ){
    return response.status(400).json({error:"Ivalid id!"})
  }
  
  request.user = userExists
  request.todo = todoExists
  
  return next()
}

function findUserById(request, response, next){
  const {id} = request.params

  const userIdExists = users.find(user=> id === user.id)

  if(!userIdExists){
    return response.status(400).json({error:"User does not exists!"})
  }

  console.log(userIdExists)

  request.user = userIdExists

  return next()
}

app.post("/users",(request, response)=>{
  const {name, username} = request.body
  
  const  usernameAlreadyExists = users.some((user)=> user.username === username)

  if(usernameAlreadyExists){
    return response.status(400).json({error:"Username already exists!"})
  }
  
  const user ={
    id: uuidv4(),
    name,
    username,
    pro: false,
    todos:[]
  }

  users.push(user)

  return response.status(201).json(user)

})

app.get("/users/:id", findUserById, (request, response)=>{
  const { user } = request
  
  return response.json(user)
})

app.patch("users/:id/pro", findUserById,(request, response)=>{
  const {user} = request

  if(user.pro){
    return response.status(400).json({error:"Pro plan is already activated!"})
  }

  user.pro = true

  return response.json(user)
})

app.get("/todos", checkExistsUserAccount, (request, response)=>{
  const {user} = request

  return response.json(user.todos)
})

app.post("/todos", checkExistsUserAccount, checksCreateTodosUserAvailability,(request, response)=>{
  const {title, deadline, done} = request.body

  const {user} = request

  const newTodo = {
    id: uuidv4(),
    title,
    done:false,
    deadline: new Date(deadline),
    created_at: new Date()
  }

  user.todos.push(newTodo);

  return response.status(201).json(newTodo)
})

app.put("/todos/:id", checksTodoExists,(request, response)=>{
  const {title,deadline} = request.body
  const {todo} = request
 
  todo.title = title
  todo.deadline = new Date(deadline)

  return response.status(201).json(todo)
})

app.patch("/todos/:id/done", checkExistsUserAccount,(request, response)=>{
  const {todo} = request
  
  todo.done = true

  return response.json(todo)
})

app.delete("/todos/:id", checkExistsUserAccount, checksTodoExists, (request, response)=>{
const {user, todo} = request

const todoIndex = user.todos.indexOf(todo)

if(todoIndex === -1){
  return response.status(404).json({error:"Todo not found!"})
}
user.todos.splice(todoIndex, 1)

return response.status(200).send()
})

app.listen(3333)