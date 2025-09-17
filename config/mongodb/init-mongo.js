db.auth("admin", "MiContraseñaSegura123")
db = db.getSiblingDB("present")
db.createUser({
  user: "admin",
  pwd: "MiContraseñaSegura123",
  roles: [
    {
      role: "readWrite",
      db: "present"
    }
  ]
})
