// TODO: Split in two files
function MessageView(element) {
  return {
    messageDOM: $('.choice-message', element),
    allPopupsDOM: $('.choice-tips, .choice-message', element),
    clearPopupEvents: function() {
      this.allPopupsDOM.hide();
      $('.close', this.allPopupsDOM).off('click');
    },
    showPopup: function(popupDOM) {
      var self = this;
      this.clearPopupEvents();
      popupDOM.show();
      popupDOM.on('click', function() {
        self.clearPopupEvents();
      });
    },
    showMessage: function(message) {
      if (_.isString(message)) {
        this.messageDOM.html(message);
        this.showPopup(this.messageDOM);
      }
      else {
        this.showPopup(message); // already a DOM
      }
    }
  }
}

function MCQBlock(runtime, element) {
    return {
        submit: function() {
            var checkedRadio = $('input[type=radio]:checked', element);

            if(checkedRadio.length) {
                return checkedRadio.val();
            } else {
                return null;
            }
        },

        handleSubmit: function(result) {
            var messageView = MessageView(element);
            var choiceInputs = $('.choice input', element);
            $.each(choiceInputs, function(index, choiceInput) {
                var choiceInputDOM = $(choiceInput),
                    choiceDOM = choiceInputDOM.closest('.choice'),
                    choiceResultDOM = $('.choice-result', choiceDOM),
                    choiceTipsDOM = $('.choice-tips', choiceDOM),
                    choiceTipsCloseDOM;

                choiceResultDOM.removeClass('incorrect icon-exclamation correct icon-ok');
                if (result.completed && choiceInputDOM.val() === result.submission) {
                    choiceResultDOM.addClass('correct icon-ok');
                }
                else if (choiceInputDOM.val() === result.submission || _.isNull(result.submission)) {
                    choiceResultDOM.addClass('incorrect icon-exclamation');
                }

              var tips = _.find(result.tips, function(obj) {
                           return obj.choice === choiceInputDOM.val();
                         });
              if (tips) {
                  choiceTipsDOM.html(tips.tips);
              }

              choiceTipsCloseDOM = $('.close', choiceTipsDOM);
                choiceResultDOM.off('click').on('click', function() {
                    if (choiceTipsDOM.html() != '') {
                      messageView.showMessage(choiceTipsDOM);
                    }
                });
            });

            if (_.isNull(result.submission)) {
                messageView.showMessage('<div class="message-content"><div class="close"></div>' +
                                        'You have not provided an answer.' + '</div>');
            }
            else if (result.tips) {
                var tips = _.find(result.tips, function(obj) {
                               return obj.choice === result.submission;
                           });
                if (tips) {
                    messageView.showMessage(tips.tips);
                } else {
                    messageView.clearPopupEvents();
                }
            }
          }
    };
}

function MRQBlock(runtime, element) {
    return {
        init: function() {
            var answerButton = $('button', element);
            answerButton.on('click', _.bind(this.toggleAnswers, this));
            this.showAnswerButton();
        },

        submit: function() {
            // hide answers
            var choiceInputDOM = $('.choice input', element),
                choiceResultDOM = $('.choice-answer', choiceInputDOM.closest('.choice'));
            choiceResultDOM.removeClass('incorrect icon-exclamation correct icon-ok');

            var checkedCheckboxes = $('input[type=checkbox]:checked', element),
                checkedValues = [];

            $.each(checkedCheckboxes, function(index, checkedCheckbox) {
                checkedValues.push($(checkedCheckbox).val());
            });
            return checkedValues;
        },

        handleSubmit: function(result, options) {
            var messageView = MessageView(element);

            if (result.message) {
                messageView.showMessage('<div class="message-content"><div class="close"></div>' +
                                        result.message + '</div>');
            }

            var answers = []; // used in displayAnswers
            $.each(result.choices, function(index, choice) {
                var choiceInputDOM = $('.choice input[value='+choice.value+']', element),
                    choiceDOM = choiceInputDOM.closest('.choice'),
                    choiceResultDOM = $('.choice-result', choiceDOM),
                    choiceAnswerDOM = $('.choice-answer', choiceDOM),
                    choiceTipsDOM = $('.choice-tips', choiceDOM),
                    choiceTipsCloseDOM;

                /* update our answers dict */
                answers.push({
                  input: choiceInputDOM,
                  answer: choice.completed ? choiceInputDOM.attr('checked') : !choiceInputDOM.attr('checked')
                });

                choiceResultDOM.removeClass('incorrect icon-exclamation correct icon-ok');
                /* show hint if checked or max_attempts is disabled */
                if (result.completed || choiceInputDOM.prop('checked') || options.max_attempts <= 0) {
                  if (choice.completed) {
                    choiceResultDOM.addClass('correct icon-ok');
                  } else if (!choice.completed) {
                    choiceResultDOM.addClass('incorrect icon-exclamation');
                  }
                }

                choiceTipsDOM.html(choice.tips);

                choiceTipsCloseDOM = $('.close', choiceTipsDOM);
                choiceResultDOM.off('click').on('click', function() {
                    messageView.showMessage(choiceTipsDOM);
                });

                choiceAnswerDOM.off('click').on('click', function() {
                  messageView.showMessage(choiceTipsDOM);
                });

            });

            this.answers = answers;
            this.showAnswerButton(options);
        },

        showAnswerButton: function(options) {
            var button = $('.show-answer', element);
            var is_enabled = options && (options.num_attempts >= options.max_attempts);

            if (is_enabled && _.isArray(this.answers)) {
                button.show();
            }
            else {
                button.hide();
            }
        },

      toggleAnswers: function() {
        var showAnswerButton = $('button span', element);
        var answers_displayed = this.answers_displayed = !this.answers_displayed;

        _.each(this.answers, function(answer) {
          var choiceResultDOM = $('.choice-answer', answer.input.closest('.choice'));
          choiceResultDOM.removeClass('correct icon-ok');
          if (answers_displayed) {
            if (answer.answer)
              choiceResultDOM.addClass('correct icon-ok');
            showAnswerButton.text('Hide Answer(s)');
          }
          else {
            showAnswerButton.text('Show Answer(s)');
          }
        });

      }

    };
}