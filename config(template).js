var config = {

  //ports
  serverPort: 3010,
  clientPort: 3000,

  //mongodb
  mongodb: {
    devUrl: "mongodb://localhost:27017/meal-app",
    testUrl: "mongodb://localhost:27017/meal-app-test"
  },

  //roles and permissions
  roles: {
    "admin": ["all-meals", "users", "send-invitation"],
    "userManager": ["users"],
    "user": []
  },

  //mailer config
  mailer: {
    service: 'gmail',
    auth: {
      user: '',
      pass: ''
    }
  },

  //jwt
  jwtSecret: "iAmTheSecretKeyForTokenEncryption",
  jwtTtl: "48h",

  //google app
  google: {
    appId: "",
    appSecret: ""
  },

  //facebook app
  facebook: {
    appId: "",
    appSecret: ""
  },

  //nutrionix API access
  nutritionix: {
    url: "https://trackapi.nutritionix.com/v2/natural/nutrients",
    headers: {
      "x-app-id": "",
      "x-app-key": "",
      "x-remote-user-id": 0
    }    
  },

};

module.exports = config;
