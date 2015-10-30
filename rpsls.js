$(function() {
  // Global variables
  var active = true,
      audio = false,
      voiceQueue = [],
      rolling = false,
      userScore = 0,
      computerScore = 0;

  // Constants
  var VOICE_LOCALE = "Australian Female",
      STEP_DELAY = 1200,
      ROLL_DELAY = 100,
      PRE_RESULT_DELAY = 300,
      POST_GAME_DELAY = 5000,
      ACTIONS = ['rock', 'paper', 'scissors', 'lizard', 'spock'],
      USER_WIN_LOOKUP = [
      // Rock Paper Scissors Lizard Spock --- User picked:
        [false, true, false, false, true], // Rock
        [false, false, true, true, false], // Paper
        [true, false, false, false, true], // Scissors
        [true, false, true, false, false], // Lizard
        [false, true, false, true, false]  // Spock
      ],
      DESCRIPTION_LOOKUP = [
        // Computer picked Rock
        [
          null,
          'Paper covers Rock, nice!',
          'Rock smashes Scissors, doh :(',
          'Rock squishes Lizard, ewww :(',
          'Spock vapourizes Rock, take that!'
        ],
        // Computer picked Paper
        [
          'Paper covers Rock, dang :/',
          null,
          'Scissors cuts Paper, snip!',
          'Lizard eats Paper, nom nom!',
          'Paper disproves Spock, :S'
        ],
        // Computer picked Scissors
        [
          'Rock smashes Scissors, kaboom!',
          'Scissors cuts Paper, watch out!',
          null,
          'Scissors decapitates Lizard, ouch!',
          'Spock destroys Scissors, nice!'
        ],
        // Computer picked Lizard
        [
          'Rock squishes Lizard, splat!',
          'Lizard eats Paper, eep!',
          'Scissors decapitates Lizard, woahaha!',
          null,
          'Lizard poisons Spock, aaaarghh'
        ],
        // Computer picked Spock
        [
          'Spock vapourizes Rock, bzzzzt :(',
          'Paper disproves Spock, take that!',
          'Spock smashes Scissors, oops',
          'Lizard poisons Spock, sssss',
          null
        ]
      ];

  /************************
   * Name: enableInputs
   * Description: Enables user inputs for the carousel
   */
  function enableInputs() {
    if (active) {
      return
    }
    $(".carousel").data("carousel").activate();
    active = true;
  }

  /************************
   * Name: disableInputs
   * Description: Disables user inputs for the carousel
   */
  function disableInputs() {
    if (!active) {
      return
    }
    $(".carousel").data("carousel").deactivate();
    active = false;
  }

  /************************
   * Name: startTheGame
   * Description: Main entry point to begin 'the game'
   */
  function startTheGame() {
    rollComputer();

    flashAndSay('Paper', {pitch: 1.5});
    setTimeout(function() {
      flashAndSay('Lizard', {pitch: 1});
      setTimeout(function() {
        flashAndSay('Spock!', {pitch: 0.5});
        rolling = false;
      }, STEP_DELAY);
    }, STEP_DELAY);
  }

  /************************
   * Name: rollComputer
   * Description: Starts the 'rolling' of random choices and displays them to the user.
   *              When the time comes, a call to `finishGame` is made
   */
  function rollComputer() {
    rolling = true;

    var roll = function() {
      // Remove the old choice
      $('.computer-container .choice').removeClass(function (index, css) {
        return (css.match (/(^|\s)fa-hand-\S+/g) || []).join(' ');
      });

      // Show the new choice
      var currentAction = ACTIONS[Math.floor(Math.random() * 5)];
      $('.computer-container .choice').addClass('fa-hand-' + currentAction + '-o');

      if (rolling) {
        // Continue rolling
        setTimeout(roll, ROLL_DELAY);
      } else {
        // OK we're done
        finishGame(currentAction);
      }
    };

    // Start the roll
    roll();
  }

  /************************
   * Name: finishGame
   * Description: Ends the game...
   *              Stops the user from changing their desired action
   *              Figures out the result
   */
  function finishGame(computerChoice) {
    disableInputs();

    // Wait a bit to let the text animation finish 
    setTimeout(function() {
      userChoice = getUserChoice();
      console.log('Computer picked: ' + computerChoice + ', User picked: ' + userChoice);
      if (computerChoice == userChoice) {
        showResult('Aww.. it\s a draw!');
      } else {
        var computerChoiceIndex = ACTIONS.indexOf(computerChoice),
            userChoiceIndex = ACTIONS.indexOf(userChoice),
            userWon = USER_WIN_LOOKUP[computerChoiceIndex][userChoiceIndex],
            resultDescription = DESCRIPTION_LOOKUP[computerChoiceIndex][userChoiceIndex];

        showResult(resultDescription);
        userWon ? increaseUserScore() : increaseComputerScore();
      }

      // Let the user soak in the awesomeness of the result
      setTimeout(function() {
        // Reset the inputs, clear the result text and start again!
        enableInputs();
        clearResult();
        startTheGame();
      }, POST_GAME_DELAY);
    }, PRE_RESULT_DELAY);
  }

  /************************
   * Name: increaseUserScore
   * Description: Increment the user score and update the UI
   */
  function increaseUserScore() {
    userScore++;
    $('.scores .user .score').text(userScore + '');
  }

  /************************
   * Name: increaseComputerScore
   * Description: Increment the computer's score and update the UI
   */
  function increaseComputerScore() {
    computerScore++;
    $('.scores .computer .score').text(computerScore + '');
  }

  /************************
   * Name: getUserChoice
   * Description: Returns the option that the user chose
   */
  function getUserChoice() {
    var closestElement = $(".carousel").data("carousel").nearestItem();
    return $(closestElement.element).data('action');
  }

  /************************
   * Name: flashAndSay
   * Description: Wrapper to call `showFlash` and `queueSay`
   */
  function flashAndSay(message, options) {
    showFlash(message);
    queueSay(message, options);
  }

  /************************
   * Name: queueSay
   * Description: Queues up some words to 'say' (with the TTS engine)
   */
  function queueSay(words, options) {
    if (responsiveVoice.isPlaying()) {
      voiceQueue.push({words: words, options: options});
    } else {
      say(words, options);
    }
  }

  /************************
   * Name: showFlash
   * Description: Displays a message by flashing it on the screen (using some animations to make it 'pop')
   */
  function showFlash(message) {
    // Remove any old messages
    $('.messages .message').remove();
    // Add the new message
    $('.messages').append('<div class="message">' + message + '</div>');
    // After a small delay, apply the CSS class to animate it
    setTimeout(function() { $('.message').addClass('grow'); }, 10);
  }

  /************************
   * Name: showResult
   * Description: Displays the result message
   */
  function showResult(message) {
    $('.result').text(message);
  }

  /************************
   * Name: clearResult
   * Description: Clears the result message
   */
  function clearResult() {
    showResult('');
  }

  /************************
   * Name: say
   * Description: Calls out to TTS engine ensuring that any remaining messages in the `voiceQueue` are also said
   */
  function say(words, options) {
    // If we don't want to hear the audio, flush the queue and return
    if (!audio) {
      voiceQueue = [];
      return
    }

    options = options === undefined ? {} : options;

    // Add a callback to handle the remaining items in the queue
    options['onend'] = function() {
      if (voiceQueue.length > 0) {
        message = voiceQueue.shift();
        say(message.words, message.options);
      }
    };

    // Call TTS engine
    responsiveVoice.speak(words, VOICE_LOCALE, options);
  }

  // When the TTS engine is ready, get the game underway
  responsiveVoice.OnVoiceReady = function() {
    flashAndSay('Ready?', {pitch: 2});
    setTimeout(startTheGame, 2000);
  };

  // Initialise the user input carousel
  $(".carousel").Cloud9Carousel({
    bringToFront: true,
    itemClass: 'fa',
    yRadius: 70,
    yOrigin: 40,
    xRadius: 110,
    xOrigin: 120
  });

  // Handle keyboard input
  document.onkeydown = function(e) {
    e = e || window.event;

    if (active) {
      // Left key press
      if (e.keyCode == '37') {
        $(".carousel").data("carousel").go(-1);
      }
      // Right key press
      else if (e.keyCode == '39') {
        $(".carousel").data("carousel").go(1);
      }
    }

    // We want to ignore any of the arrow keys
    if (['37', '38', '39', '40'].indexOf(e.keyCode + '') >= 0) {
      return false;
    }
  };

  // Allow the audio to be turned on/off
  $('.audio-controls .fa').on('click', function() {
    audio = $(this).hasClass('on');
    $('.audio-controls .on').toggleClass('hide', audio);
    $('.audio-controls .off').toggleClass('hide', !audio);
  });
});
