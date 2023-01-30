import Adapt from 'core/js/adapt';
import a11y from 'core/js/a11y';
import device from 'core/js/device';
import QuestionView from 'core/js/views/questionView';

export default class ScaleView extends QuestionView {

  events() {
    return {
      'click .js-scale-option': 'onItemSelected'
    };
  }

  initialize(...args) {
    super.initialize(...args);
  }

  resetQuestionOnRevisit() {
    this.setAllItemsEnabled(true);
    this.resetQuestion();
  }

  setupQuestion() {
    this.model.setupRandomisation();
    this.model.restoreUserAnswers();
  }

  disableQuestion() {
    this.setAllItemsEnabled(false);
  }

  enableQuestion() {
    this.setAllItemsEnabled(true);
  }

  setAllItemsEnabled(isEnabled) {
    this.model.get('_items').forEach((item, index) => {
      const $item = this.$('.scale-item').eq(index);

      if (isEnabled) {
        this.deselectAllOptions($item);
      }

      this.model.get('_options').forEach((item, index) => {
        const $option = $item.find('.scale-item__option');

        if (isEnabled) {
          $option.removeClass('is-disabled');
        } else {
          $option.addClass('is-disabled');
        }
      });

    });
  }

  onQuestionRendered() {
    this.onDeviceChanged();
    this.setLayout();
    this.setAriaLabels();
    this.setReadyStatus();

    this.listenTo(Adapt, 'device:changed', this.onDeviceChanged, this);

    if (!this.model.get('_isSubmitted')) return;
    this.showMarking();
    this.disableQuestion();
  }

  setAriaLabels() {
    this.model.get('_items').forEach((item, index) => {
      const $item = this.$('.scale-item').eq(index);

      this.model.get('_options').forEach((item, index) => {
        const $option = $item.find(`[data-index="${index}"]`);
        $option.attr('aria-label', this.model.get('_options')[index].text);
      });

    });
  }

  onDeviceChanged() {
    if (device.screenSize === "small") {
      this.$el.addClass('is-scale-mobile');
    } else {
      this.$el.removeClass('is-scale-mobile');
    }
  }

  setLayout() {
    jQuery.cssNumber.gridColumnStart = true;
    jQuery.cssNumber.gridColumnEnd = true;
    jQuery.cssNumber.gridRowStart = true;
    jQuery.cssNumber.gridRowEnd = true;

    for (let i = 0; i < this.model.get('_options').length; i++) {
      this.$(`[option-index="${i}"]`).css({
        'grid-column-start': i + 2,
        'grid-column-end': i + 3,
        'grid-row-start': 1,
        'grid-row-end': 2
      });
    }

    for (let i = 0; i < this.model.get('_items').length; i++) {
      this.$('.item-'+i).find('.scale-item__inner').css({
        'grid-column-start': 1,
        'grid-column-end': 2,
        'grid-row-start': i + 2,
        'grid-row-end': i + 3
      });
    }

    // Option rows
    for (let i = 0; i < this.model.get('_items').length; i++) {
      this.$(`[grid-index="${i}"]`).css({
        'grid-row-start': i + 2,
        'grid-row-end': i + 3
      });
    }

    // Option columns
    for (let i = 0; i < this.model.get('_options').length; i++) {
      this.$(`[data-index="${i}"]`).css({
        'grid-column-start': i + 2,
        'grid-column-end': i + 3
      });
    }
  }

  onItemSelected(event) {
    if (this.model.get('_isEnabled') && !this.model.get('_isSubmitted')) {
      const selectedItemObject = this.model.get('_items')[$(event.currentTarget).attr('data-item-index')];
      const selectedOption = $(event.currentTarget).attr('data-index');
      this.toggleItemSelected(selectedItemObject, selectedOption, event);
    }
  }

  toggleItemSelected(item, optionIndex, clickEvent) {
    const itemIndex = $(clickEvent.currentTarget).attr('data-item-index');
    const $item = this.$('.scale-item').eq(itemIndex);
    const $option = $(clickEvent.currentTarget);

    this.deselectAllOptions($item);

    $option.addClass('is-selected');
    a11y.toggleAccessibleEnabled($option, false);
    a11y.focusNext($option);

    item._isSelected = parseInt(optionIndex) + 1;

    this.model.checkCanSubmit();
  }

  showMarking() {
    if (!this.model.get('_canShowMarking')) return;

    this.model.get('_items').forEach(({ _isCorrect }, i) => {
      const $item = this.$('.item-'+i);

      $item.removeClass('is-correct is-incorrect').addClass(_isCorrect ? 'is-correct' : 'is-incorrect');
    });
  }

  resetQuestion() {
    this.deselectAllItems();
    this.resetItems();
    this.setAllItemsEnabled(true);

    this.model.get('_items').forEach((item) => {
      item._isCorrect = false;
    });
  }

  deselectAllItems() {
    a11y.toggleAccessibleEnabled(this.$el, true);
    this.model.deselectAllItems();
  }

  deselectAllOptions($item) {
    this.model.get('_options').forEach((item, index) => {
      const $option = $item.find('.scale-item__option');
      $option.removeClass('is-selected');
      if (!this.model.get('_isSubmitted')) {
        a11y.toggleAccessibleEnabled($option, true);
      } else {
        a11y.toggleAccessibleEnabled($option, false);
      }
    });
  }

  resetItems() {
    this.$('.scale-item__option').removeClass('is-selected');
    this.$('.scale-item').removeClass('is-correct is-incorrect');
    this.model.resetItems();
  }

  showCorrectAnswer() {
    this.model.get('_items').forEach((item, index) => {
      const $item = this.$('.item-'+index);
      const $option = $item.find('.scale-item__option').eq(item._correctOption - 1);

      this.deselectAllOptions($item);

      $option.addClass('is-selected');
    });
  }

  hideCorrectAnswer() {
    this.model.get('_items').forEach((item, index) => {
      const $item = this.$('.item-'+index);
      const $option = $item.find('.scale-item__option').eq((this.model.get('_userAnswer')[item._index]) - 1);

      this.deselectAllOptions($item);

      $option.addClass('is-selected');
    });
  }
}
