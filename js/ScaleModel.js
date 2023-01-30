import Adapt from 'core/js/adapt';
import QuestionModel from 'core/js/models/questionModel';

export default class ScaleModel extends QuestionModel {

  init() {
    super.init();

    this.setupQuestionItemIndexes();

    this.set('_selectedItems', []);

    this.checkCanSubmit();
  }

  setupQuestionItemIndexes() {
    this.get('_items').forEach((item, index) => {
      if (item._index === undefined) {
        item._index = index;
        item._selected = null;
      }
    });
  }

  restoreUserAnswers() {
    if (!this.get('_isSubmitted')) return;

    const selectedItems = [];
    const userAnswer = this.get('_userAnswer');

    this.get('_items').forEach(item => {
      item._isSelected = userAnswer[item._index];
      if (item._isSelected) {
        selectedItems.push(item);
      }
    });

    this.set('_selectedItems', selectedItems);

    this.setQuestionAsSubmitted();
    this.markQuestion();
    this.setScore();
    this.setupFeedback();
  }

  setupRandomisation() {
    if (!this.get('_isRandom') || !this.get('_isEnabled')) return;
    this.set('_items', _.shuffle(this.get('_items')));
  }

  canSubmit() {
    let count = 0;

    this.get('_items').forEach(item => {
      if (item._isSelected !== null) {
        count++;
      }
    });

    return (count === this.get('_items').length) ? true : false;
  }

  storeUserAnswer() {
    const userAnswer = [];
    const items = this.get('_items').slice(0);

    items.sort(function(a, b) {
      return a._index - b._index;
    });

    items.forEach(item => {
      userAnswer.push(item._isSelected);
    });

    this.set('_userAnswer', userAnswer);
  }

  isCorrect() {
    const numberOfRequiredAnswers = this.get('_items').length;
    let numberOfCorrectAnswers = 0;
    let numberOfIncorrectAnswers = 0;

    this.get('_items').forEach(item => {
      if (item._isSelected === item._correctOption) {
        numberOfCorrectAnswers ++;
        item._isCorrect = true;
        this.set('_isAtLeastOneCorrectSelection', true);
      }
    });

    this.set('_numberOfCorrectAnswers', numberOfCorrectAnswers);
    this.set('_numberOfRequiredAnswers', numberOfRequiredAnswers);

    // Check if correct answers matches correct items and there are no incorrect selections
    const answeredCorrectly = (numberOfCorrectAnswers === numberOfRequiredAnswers);
    return answeredCorrectly;
  }

  setScore() {
    const questionWeight = this.get('_questionWeight');

    if (this.get('_isCorrect')) {
      this.set('_score', questionWeight);
      return;
    }

    const numberOfCorrectAnswers = this.get('_numberOfCorrectAnswers');
    const itemLength = this.get('_items').length;

    const score = questionWeight * numberOfCorrectAnswers / itemLength;

    this.set('_score', score);
  }

  isPartlyCorrect() {
    return this.get('_isAtLeastOneCorrectSelection');
  }

  resetUserAnswer() {
    this.set('_userAnswer', []);
  }

  deselectAllItems() {
    this.get('_items').forEach(item => {
      item._isSelected = null;
    });
  }

  resetItems() {
    this.set({
      _selectedItems: [],
      _isAtLeastOneCorrectSelection: false
    });
  }

  /**
   * used by adapt-contrib-spoor to get the user's answers in the format required by the cmi.interactions.n.student_response data field
   * returns the user's answers as a string in the format "1,5,2"
   */
  getResponse() {
    const items = this.get('_items');
    const selectedIndexes = _.pluck(items, '_isSelected');
    const responses = [];

    // indexes are 0-based, we need them to be 1-based for cmi.interactions
    for (let i = 0, count = selectedIndexes.length; i < count; i++) {
      responses.push((i + 1) + "." + (selectedIndexes[i]++)); // convert from 0-based to 1-based counting
    }

    return responses.join('#');
  }

  /**
   * used by adapt-contrib-spoor to get the type of this question in the format required by the cmi.interactions.n.type data field
   */
  getResponseType() {
    return "matching";
  }
}
