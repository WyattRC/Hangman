const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const handlebars = require('express-handlebars');
const session = require('express-session');
const validator = require('express-validator');
const words = fs.readFileSync("/usr/share/dict/words", "utf-8").toLowerCase().split("\n");
const morgan = require('morgan');
const app = express();


app.engine('handlebars', handlebars());
app.set('views', './views');
app.set('view engine', 'handlebars');

app.use(session({
  secret: 'keyboard-warrior',
  resave: false,
  saveUninitialized: true
}));

app.use(morgan('dev'));

app.use(express.static('public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

app.use(validator());

app.use((req, res, next) => {
  if (!req.session.theWord) {
    req.session.theWord = [];
  }
  console.log(req.session + "is working");
  next();
});



let theWord;
let wordArray;
let guessedLetters = [];
let turnCount = 8;
let blankArray = [];


app.get("/", function(req, res) {
  if (req.session.theWord.length === 0) {
    theWord = words[Math.floor(Math.random() * words.length)]
    wordArray = (theWord.toUpperCase()).split("");
    req.session.theWord = wordArray;
    console.log(wordArray);
    for (var i = 0; i < theWord.length; i++) {
      blankArray.push("_");
    }
  }
  res.render('games', {
    blankArray: blankArray,
    turnCount: turnCount
  })
});

app.post("/playerGuess", function(req, res) {
  let letter = req.body.letter.toUpperCase();


  req.checkBody('letter', 'oops you forgot to add type a letter').notEmpty();
  req.checkBody('letter', '1 letter at a time please').len(1, 1);

  req.getValidationResult()

    .then((result) => {
      if (!result.isEmpty()) {
        throw new Error(result.array().map((item) => item.msg).join(' - '));
      } else if (guessedLetters.includes(letter)) {
        throw new Error('You already guess that!');
      } else {
        console.log('proper input entered')
      }
    })


    .then(() => {
      if (wordArray.includes(letter)) {
        if (!guessedLetters.includes(letter)) {
          guessedLetters.push(letter);
        }

        for (let i = 0; i < wordArray.length; i++){
          if (letter === wordArray[i]) {
            blankArray.splice(i, 1, letter);
          }
        }

          if(wordArray.join("").toString() === blankArray.join("").toString()){
            return res.render('won', {
              theWord : theWord
            });
          }
      } else {
      if (!guessedLetters.includes(letter)) {
        guessedLetters.push(letter);
        turnCount--;
        if(turnCount === 0){
          return res.render('lost', {
            theWord : theWord
          })
        }
      }
      }

      res.render('games', {
        blankArray: blankArray,
        guessedLetters: guessedLetters,
        turnCount: turnCount
      });
    })

    .catch((error) => {
      console.log(error);
      res.render('games', {
        error: error,
        blankArray: blankArray,
        turnCount: turnCount,
        guessedLetters: guessedLetters
      })
    });

})

app.post('/playAgain', (req, res) =>{
  req.session.theWord = [];
  guessedLetters = [];
  blankArray = [];
  turnCount = 8;
  res.redirect('/')
})




app.listen(3000, () => console.log('successa'));
