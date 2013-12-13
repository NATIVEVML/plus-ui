/*
* jQuery NOs 0.9.15
*
* Dual licensed under the MIT or GPL Version 2 licenses.
*/
(function( $, undefined ) {

window.NosUIApp = {
	namespace: 'nosui',
	defineOptions: function(defaults, options){
		// both don't exist
		if(typeof options !== 'object' && typeof defaults !== 'object'){
			return this.createPrivateMethods({});

		// both exist
		} else if(typeof options === 'object' && typeof defaults === 'object'){
			$.extend(true, defaults, options);

			if(typeof defaults.elAttrNames === 'object' && typeof defaults.namespace === 'string'){
				// Apply namespace to class names
				this.applyCssNamespace(defaults.elAttrNames, defaults.namespace);
			}

			return this.createPrivateMethods(defaults);

		// if options doesn't exist
		} else if(typeof options !== 'object'){

			if(typeof defaults.elAttrNames === 'object' && typeof defaults.namespace === 'string'){
				// Apply namespace to class names
				this.applyCssNamespace(defaults.elAttrNames, defaults.namespace);
			}

			return this.createPrivateMethods(defaults);

		// If defaults doesn't exist - should cover everything
		} else if(typeof defaults !== 'object'){
			return this.createPrivateMethods(options);
		}
	},
	createPrivateMethods: function(obj){
		obj.dom = {};
		// This is used to prevent stackoverflows within callbacks
		obj._stackOverflow = 0;
		return obj;
	},
	matchElType: function($elType, $el){
		if(!$elType.filter($el).length){ // $el is NOT of the correct element type
			var elSelector = this.getFullElSelector($el);

			throw new Error('Incorrect element type targetted with the NOS-UI script. Element: ' + elSelector + '. Or a jQuery object not yet attached to the DOM is being used.');
		}
	},
	getFullElSelector: function($el){
		var el = $el.get(0),
			elAttrId = el.id,
			elIdSelector = elAttrId !== '' ? '#' + elAttrId : '',
			elAttrClass = el.getAttribute('class'),
			elClassSelector = elAttrClass ? '.' + elAttrClass.trim().split(' ').join('.') : '',
			elSelector = elIdSelector + elClassSelector;

		return elSelector;
	},
	form: {
		isDisabled: function($el, $fauxEl, className) {
			if(typeof $el == 'undefined'){
				throw new Error('missing $el parameter');
			} else if (typeof $fauxEl == 'undefined') {
				throw new Error('missing $fauxEl parameter');
			} else if (typeof className == 'undefined'){
				throw new Error('missing className parameter');
			}

			if($el.prop('disabled')){
				$fauxEl.addClass(className);
				return true;
			} else {
				$fauxEl.removeClass(className);
				return false;
			}
		}
	},
	applyCssNamespace: function(elAttrNames, nameSpace){
		$.each(elAttrNames, function(k, v){
			if(typeof v === 'object' && v !== null){
				this.applyCssNamespace(elAttrNames[k], nameSpace);
			} else if(typeof v === 'string'){
				elAttrNames[k] = nameSpace + v;
			}
		});
	},
	elList: {
		responsiveImages: []
	}
};

$.fn.extend({

	nosInputPlaceholder: function( options, disableMethod ) {

		return this.each(function(){

			var defaults = {
					elAttrNames: {
						elClass: '',
						hasPlaceholderClass: '--placeholder-active'
					},
					namespace: 'nosui-input-placeholder',
					placeholder: null
				},
				o = NosUIApp.defineOptions(defaults, options);

			o.dom.$el = $(this);
			NosUIApp.matchElType($('input'), o.dom.$el);

			if(disableMethod === true){
				disable();
				return;
			}

			function disable(){
				o.dom.$el.off().removeClass(o.elAttrNames.hasPlaceholderClass).val('');
			}

			function init(){
				if(typeof o.placeholder === 'string') {
					o.dom.$el.attr('placeholder', o.placeholder);
				}

				o.dom.val = o.dom.$el.attr('placeholder');

				// The value hasn't been defined
				// and cannot be guessed either.
				// Everything should stop here
				if(typeof o.dom.val !== 'string') {
					return;
				}

				// Set value
				o.dom.$el.addClass(o.elAttrNames.elClass);
				blurInput();
			}

			function focusInput(){
				// Focus Callback
				if(typeof o.onFocus === 'function') {
					o.onFocus(o.dom.$el);
				}

				if(o.dom.$el.val() == o.dom.val){
					o.dom.$el.removeClass(o.elAttrNames.hasPlaceholderClass).val('');
				}
			}

			function blurInput(){
				// Blur Callback
				if(typeof o.onBlur === 'function') {
					o.onBlur(o.dom.$el);
				}

				if(o.dom.$el.val() === '' || o.dom.$el.val() == o.dom.val) {
					o.dom.$el.addClass(o.elAttrNames.hasPlaceholderClass).val(o.dom.val);
				}
			}

			function events(){
				// Turn off functions
				// Incase this is called twice
				o.dom.$el.off({
					'focus.nosui-placeholder': focusInput,
					'blur.nosui-placeholder': blurInput
				});

				// Turn on functions
				o.dom.$el.on({
					'focus.nosui-placeholder': focusInput,
					'blur.nosui-placeholder': blurInput
				});
			}

			init();
			events();

		});

	}, // nosPlaceholder()
	nosFormSelect: function( options, disableMethod ){

		return this.each(function(){

			var defaults = {
					elAttrNames: { // Attr names without a namespace
						typeDefault: {
							'defaultClass': '--default'
						},
						typeCustom: {
							'defaultClass'    : '--custom',
							'dataSelected'    : '-selected',
							'listClass'       : '__list',
							'itemClass'       : '__item',
							'activeItemClass' : '__item--active',
							'firstItemClass'  : '__item--first',
							'lastItemClass'   : '__item--last'
						},
						'elClass'            : '-element',
						'fauxElClass'        : '',
						'activeClass'        : '--active',
						'mousedownClass'     : '--mousedown',
						'disabledClass'      : '--disabled',
						'dropdownButtonClass': '__dropdown-button',
						'placeholderClass'   : '__placeholder',
						'dataName'           : '-type'
					},
					namespace: 'nosui-form-select',
					defaultDropdown: false,
					isOpen: false,
					onInit: null,
					onClick: null,
					onChange: null,
					onMousedown: null, // Only used for defaultDropdown: false
					onBlur: null // Only used for defaultDropdown: true
				};

			// Ensure options is an object
			if(!options || typeof options !== 'object') options = {};

			// If namespace has already been set, make sure it stays the same
			if(typeof $(this).data('nosui-namespace') === 'string'){
				options.namespace = $(this).data('nosui-namespace');
			}

			var o = NosUIApp.defineOptions(defaults, options);
			o.dom.$el = $(this);

			// Match element or throw error
			NosUIApp.matchElType($('select'), o.dom.$el);

			// Restore element back to original state
			if(disableMethod === true && o.dom.$el.data(o.elAttrNames.dataName) == 'custom'){
				// Changing the data on the element to
				// reflect that it has been disabled
				o.dom.$el.removeClass(o.elAttrNames.elClass).data(o.elAttrNames.dataName, null).show();

				// Turn off fauxEl and fauxOptions events
				o.dom.$el.prev().off() // turn off fauxEl events
					.find('.' + o.elAttrNames.typeCustom.itemClass).off() //turn off fauxOption events
					.end().remove(); // remove fauxEl
				return;
			} else if(disableMethod === true){
				// Changing the data on the element to
				// reflect that it has been disabled
				o.dom.$el.removeClass(o.elAttrNames.elClass).data(o.elAttrNames.dataName, null).off({
					'click.nosui-form-select': null,
					'change.nosui-form-select': null,
					'blur.nosui-form-select': null
				}).siblings().remove(); // remove placeholder and button
				o.dom.$el.unwrap();

				return;
			}

			o.dom.$elOptions = o.dom.$el.find('option');
			o.dom.$selectedOption = o.dom.$elOptions.filter(function(){
					return $(this).prop('selcted') === true;
				});

			o.dom.$el.addClass(o.elAttrNames.elClass)
				.data('nosui-namespace', o.namespace);

			function initDefault() {
				if ( o.defaultDropdown === true ) {

					// Adding element physical properties
					o.dom.$el.data(o.elAttrNames.dataName, 'default')
						.addClass(o.elAttrNames.elClass)
						.wrap(
							$('<div />', {
								'class': o.elAttrNames.fauxElClass + ' ' + o.elAttrNames.typeDefault.defaultClass,
								'id': o.dom.$el.attr('id') ? o.elAttrNames.fauxElClass + '-' + o.dom.$el.attr('id') : ''
							})
						);

					// Creating variables and dom elements
					o.dom.elName = o.dom.$el.attr('name') ? o.dom.$el.attr('name') : null;
					o.dom.$fauxSelect = o.dom.$el.parent();

					o.dom.$fauxSelect.data('name', o.dom.elName);

					var placeholderText = o.dom.$selectedOption.length ? o.dom.$selectedOption.text() : o.dom.$elOptions.first().text();
						// Adding select placeholder text
					o.dom.$placeholder = $('<div />', {
						'class': o.elAttrNames.placeholderClass,
						'text': placeholderText
					}).prependTo( o.dom.$fauxSelect ),

					o.dom.$dropdownButton = $('<div />', {
						'class': o.elAttrNames.dropdownButtonClass
					}).insertAfter( o.dom.$placeholder );

					// Applied for disabled styling if applied
					NosUIApp.form.isDisabled(o.dom.$el, o.dom.$fauxSelect, o.elAttrNames.disabledClass);

					// Event Callback
					if(typeof o.onInit === 'function') {
						o.onInit(o.dom.$el, o.dom.$fauxSelect, o);
					}

				} // initDefault

			}

			function eventsDefault() {
				if ( o.defaultDropdown === true ) {
					o.dom.$el.on({
						'focus.nosui-form-select': function() {
							// Applied for disabled styling if applied
							NosUIApp.form.isDisabled(o.dom.$el, o.dom.$fauxSelect, o.elAttrNames.disabledClass);
							o.dom.$fauxSelect.toggleClass( o.elAttrNames.activeClass );

							// Event Callback
							if(typeof o.onClick === 'function') {
								o.onClick(o.dom.$el, o.dom.$fauxSelect, o);
							}
						},
						'change.nosui-form-select': function() {
							o._stackOverflow++;
							var text = o.dom.$el.find(':selected').text();
							o.dom.$placeholder.text(text);

							// Event Callback
							if(typeof o.onChange === 'function' && o._stackOverflow <= 1) {
								o.onChange(o.dom.$el, o.dom.$fauxSelect, o);
							}
							o._stackOverflow = 0;
						},
						'blur.nosui-form-select': function() {
							o.dom.$fauxSelect.removeClass( o.elAttrNames.activeClass );

							// Event Callback
							if(typeof o.onBlur === 'function') {
								o.onBlur(o.dom.$el, o.dom.$fauxSelect, o);
							}
						}
					});
				}
			}

			initDefault();
			eventsDefault();

			function initCustom() {
				if ( o.defaultDropdown !== true ) {
					// Set data for plugin
					o.dom.$el.data(o.elAttrNames.dataName, 'custom');

					// Set vars
					o.dom.elName = o.dom.$el.attr('name') ? o.dom.$el.attr('name') : null,
					o.dom.$fauxSelect = $('<div />', {
						'class': o.elAttrNames.fauxElClass + ' ' + o.elAttrNames.typeCustom.defaultClass,
						'id': o.dom.$el.attr('id') ? o.elAttrNames.fauxElClass + '-' + o.dom.$el.attr('id') : ''
					}).data('name', o.dom.elName);

					// Check if is disabled
					// If so add the necessary classes
					NosUIApp.form.isDisabled(o.dom.$el, o.dom.$fauxSelect, o.elAttrNames.disabledClass);

					o.dom.$el.hide().before( o.dom.$fauxSelect );

					// Creating List
					o.dom.$fauxSelectList = $('<div />', {
						'class': o.elAttrNames.typeCustom.listClass
					}).appendTo( o.dom.$fauxSelect ).hide();

					o.dom.$dropdownButton = $('<div />', {
						'class': o.elAttrNames.dropdownButtonClass
					}).appendTo( o.dom.$fauxSelect );

					// For each option, create a fauxOption
					o.dom.$elOptions.each( function( i ) {
						$('<div />', {
							'class': i === 0 ? o.elAttrNames.typeCustom.activeItemClass + ' ' + o.elAttrNames.typeCustom.itemClass : o.elAttrNames.typeCustom.itemClass,
							'text': $(this).text()
						})
							.data(NosUIApp.namespace + '-selected', $(this).prop('selected'))
							.appendTo( o.dom.$fauxSelectList );
					});

					o.dom.$fauxOptions = o.dom.$fauxSelect.find('.' + o.elAttrNames.typeCustom.itemClass);
					o.dom.$fauxSelectedOption = o.dom.$fauxOptions.filter(function(){
						return $(this).data(NosUIApp.namespace + '-selected');
					});

					// Add first/last classes to faux o
					o.dom.$fauxOptions.first().addClass(o.elAttrNames.typeCustom.firstItemClass);
					o.dom.$fauxOptions.last().addClass(o.elAttrNames.typeCustom.lastItemClass);

					// If nothing is selected, select the first in the list
					if(!o.dom.$fauxSelectedOption.length){
						o.dom.$fauxSelectedOption = o.dom.$fauxOptions.eq(0);
					}

					// Adding select placeholder text
					o.dom.$placeholder = $('<div />', {
						'class': o.elAttrNames.placeholderClass,
						'text': o.dom.$fauxSelectedOption.text()
					}).insertBefore( o.dom.$fauxSelectList );

					NosUIApp.form.isDisabled(o.dom.$el, o.dom.$fauxSelect, o.elAttrNames.disabledClass);

					// Event Callback
					if(typeof o.onInit === 'function') {
						o.onInit(o.dom.$el, o.dom.$fauxSelect, o);
					}

				} // initCustom()
			}

			function eventsCustom() {
				if ( o.defaultDropdown !== true ) {
					o.dom.$el.on({
						'change.nosui-form-select': function(e){
							reflectChange(e);
					}
				});
			}

			if ( o.defaultDropdown !== true ) {
					// Faux select Events
					o.dom.$fauxSelect.on({
						'click.nosui-form-select': function() {
							// Return if select is disabled
							if(NosUIApp.form.isDisabled(o.dom.$el, o.dom.$fauxSelect, o.elAttrNames.disabledClass) === true) {
								return;
							}

							if(typeof o.onClick === 'function') {
								o.onClick(o.dom.$el, o.dom.$fauxSelect, o);
							}

							toggleDropdown(); // Toggle list
						},
						'mousedown.nosui-form-select': function(e) {
							//e.stopPropagation();

							// Apply disabled styled if disabled
							// returns false if disabled.
							// If disabled stop running the function
							if(NosUIApp.form.isDisabled(o.dom.$el, o.dom.$fauxSelect, o.elAttrNames.disabledClass)){
								return;
							}

							// This is to stop the body mouse down event from firing
							// when the list is open. This causes a click on the list
							// when open to close and re-open
							if(o.isOpen){
								e.stopPropagation();
							}

							o.dom.$fauxSelect.addClass(o.elAttrNames.mousedownClass);

							// Prevent bug where checkbox can be left selected
							$('body').on('mouseup.nosui-form-select', function(){
								o.dom.$fauxSelect.removeClass(o.elAttrNames.mousedownClass);

								// Remove event
								$('body').off('mouseup.nosui-form-select');
							});

							// Event Callback
							if(typeof o.onMousedown === 'function') {
								o.onMousedown(o.dom.$el, o.dom.$fauxSelect, o);
							}
						},
						'mouseup.nosui-form-select': function() {
							o.dom.$fauxSelect.removeClass(o.elAttrNames.mousedownClass);

							// Remove event
							$('body').off('mouseup.nosui-form-select');
						}
					});

					// Click functionality for fauxOption elements
					o.dom.$fauxOptions.on({
						'mousedown.nosui-form-select': function() {
							selectOption($(this));
						}
					}); // .select li.click
				}

				function toggleDropdown() {
					// Toggle isOpen property
					if(o.isOpen === false){
						showDropdown();
					} else {
						hideDropdown();
					}
				}

				function showDropdown() {

					o.dom.$fauxSelect.addClass(o.elAttrNames.activeClass);
					o.dom.$fauxSelectList.show();

					// This event must be `mousedown` instead of `click` otherwise
					// the select will immediately hide once clicked
					$('body').on('mousedown.nosui-form-select', function(){
						hideDropdown(o.dom.$fauxSelect);
					});

					o.isOpen = true;
				}

				function hideDropdown() {
					o.dom.$fauxSelectList.hide();

					o.isOpen = false;

					// This event must be `mousedown` instead of `click` otherwise
					// the select will immediately hide once clicked
					$('body').off('mousedown.nosui-form-select');

					o.dom.$fauxSelect.removeClass(o.elAttrNames.activeClass);
				}

				// Select option based on target faux option
				function selectOption($fauxOption){
					var index = $fauxOption.index();

					// Change selected item on the select menu
					o.dom.$elOptions.prop('selected', false)
						.eq(index).prop('selected', true);

					// Force the default element change event to fire
					// This is for consistency with the defaultDropdown option
					o.dom.$el.change();
				}

				// Reflect selected state element
				function reflectChange(){
					o._stackOverflow++;

					o.dom.$selectedOption     = o.dom.$el.find('option:selected');
					var index                  = o.dom.$selectedOption.index();
					o.dom.$fauxSelectedOption = o.dom.$fauxOptions.eq(index);
					var text                   = o.dom.$fauxSelectedOption.text();

					o.dom.$fauxSelectedOption.addClass(o.elAttrNames.typeCustom.activeItemClass).data('nosui-selected', 'selected')
						.siblings().removeClass(o.elAttrNames.typeCustom.activeItemClass).data('nosui-selected', null);
					o.dom.$placeholder.text(text);

					// Change selected item on the select menu
					o.dom.$elOptions.prop('selected', false)
						.eq(index).prop('selected', true);
					o.dom.$fauxOptions.data(NosUIApp.namespace + 'selected', false)
						.eq(index).data(NosUIApp.namespace + 'selected', true);

					if(typeof o.onChange === 'function' && o._stackOverflow <= 1) {
						o.onChange(o.dom.$el, o.dom.$fauxSelect, o);
					}

					o._stackOverflow = 0;
				}

			}

			// Run
			initCustom();
			eventsCustom();

		}); // each

	}, // nosFormSelect
	nosInputCheckbox: function(options, disableMethod){

		return this.each(function(){

			var defaults = {
					elAttrNames: {
						'fauxElClass'   : '',
						'disabledClass' : '--disabled',
						'checkedClass'  : '--checked',
						'mousedownClass': '--mousedown'
					},
					namespace: 'nosui-form-checkbox',
					onInit: null,
					onChange: null,
					onMousedown: null
				},
				o = NosUIApp.defineOptions(defaults, options);

			o.dom.$el = $(this);

			// Match element or throw error
			NosUIApp.matchElType($('input[type="checkbox"]'), o.dom.$el);

			if(disableMethod === true){
				disable();
				return;
			}

			function disable(){
				// Changing the data on the element to
				// reflect that it has been disabled
				o.dom.$el.prev('.' + o.elAttrNames.fauxElClass).off() // Turn off fauxEl events
					.remove(); // Remove fauxEl
				o.dom.$el.show(); // Show the element
			}

			function init(){
				o.dom.$fauxEl = $('<div />', {
						'class': o.elAttrNames.fauxElClass + ' ' + o.elAttrNames.inputClass
					})
					.data('nosui-checked', o.dom.$el.prop('checked'))
					.insertBefore( o.dom.$el.hide() );

				NosUIApp.form.isDisabled(o.dom.$el, o.dom.$fauxEl, o.elAttrNames.disabledClass);

				// Force fauxEl to match the checked state of the
				// input on init
				if(o.dom.$el.prop('checked')){
					o.dom.$fauxEl.addClass(o.elAttrNames.checkedClass);
				}

				// Event Callback
				if(typeof o.onInit === 'function') {
					o.onInit(o.dom.$el, o.dom.$fauxEl, o);
				}
			}

			function reflectChange(){
				o._stackOverflow++;

				// Toggle Attribute
				if(o.dom.$el.prop('checked')){
					o.dom.$el.data('nosui-checked', true);
					o.dom.$fauxEl.addClass(o.elAttrNames.checkedClass);
				} else {
					o.dom.$el.data('nosui-checked', false);
					o.dom.$fauxEl.removeClass(o.elAttrNames.checkedClass);
				}

				if(typeof o.onChange === 'function' && o._stackOverflow <= 1) {
					o.onChange(o.dom.$el, o.dom.$fauxEl, o);
				}

				o._stackOverflow = 0;
			}

			function events(){
				o.dom.$el.on({
					'change.nosui': reflectChange
				});

				o.dom.$fauxEl.on({
					'click.nosui': function(){
						// This applies disabled styled if disabled
						// returns false.
						// If disabled stop running the function
						if(NosUIApp.form.isDisabled(o.dom.$el, o.dom.$fauxEl, o.elAttrNames.disabledClass)){
							return;
						}

						// Toggle Attribute
						if(o.dom.$el.prop('checked')){
							o.dom.$el.prop('checked', false);
						} else {
							o.dom.$el.prop('checked', true);
						}

						o.dom.$el.change();
					},
					'mousedown.nosui': function() {
						// This applies disabled styled if disabled
						// returns false.
						// If disabled stop running the function
						if(NosUIApp.form.isDisabled(o.dom.$el, o.dom.$fauxEl, o.elAttrNames.disabledClass)){
							return;
						}

						o.dom.$fauxEl.addClass(o.elAttrNames.mousedownClass);

						// Prevent bug where checkbox can be left selected
						$('body').on('mouseup.nosui', function(){
							o.dom.$fauxEl.removeClass(o.elAttrNames.mousedownClass);

							// Remove event
							$('body').off('mouseup.nosui');
						});

						// Event Callback
						if(typeof o.onMousedown === 'function') {
							o.onMousedown(o.dom.$el, o.dom.$fauxEl, o);
						}
					},
					'mouseup.nosui': function() {
						o.dom.$fauxEl.removeClass(o.elAttrNames.mousedownClass);

						// Remove event
						$('body').off('mouseup.nosui');
					}
				});
			}

			init();
			events();

		}); // this.each()

	}, // nosFormCheckbox()
	nosInputRadio: function(options, disableMethod){

		return this.each(function(i, el){

			var defaults = {
					elAttrNames: {
						'fauxElClass'    : '',
						'inputClass'     : '-text',
						'disabledClass'  : '--disabled',
						'checkedClass'   : '--checked',
						'mousedownClass' : '--mousedown'
					},
					namespace: 'nosui-form-radio',
					onInit: null,
					onChange: null,
					onMousedown: null
				},
				o = NosUIApp.defineOptions(defaults, options);

			o.dom.$el = $(el);

			// Match element or throw error
			NosUIApp.matchElType($('input[type="radio"]'), o.dom.$el);

			if(disableMethod === true){
				disable();
				return;
			}

			function disable(){
				// Changing the data on the element to
				// reflect that it has been disabled
				o.dom.$el.prev('.' + o.elAttrNames.fauxElClass).off() // Turn off fauxEl events
					.remove(); // Remove fauxEl
				o.dom.$el.show(); // Show the element
			}

			function init(){
				o.dom.elName           = o.dom.$el.attr('name');
				o.dom.$elContainerForm = o.dom.$el.closest('form').length ? o.dom.$el.closest('form') : $('body');
				o.dom.$elSiblings      = o.dom.$elContainerForm.find('input[type="radio"]').filter(function(){
						return $(this).attr('name') == o.dom.elName;
					}).not(o.dom.$el);
				o.dom.$fauxEl = $('<div />', {
					'class': o.elAttrNames.fauxElClass
				})
					.data(NosUIApp.namespace + '-name', o.dom.elName)
					.data(NosUIApp.namespace + '-checked', o.dom.$el.prop('checked')) // Copy element checked property value
					.insertBefore( o.dom.$el.hide() );

				// Force fauxEl to match the checked state of the
				// input on init
				if(o.dom.$fauxEl.data(NosUIApp.namespace + '-checked')){
					o.dom.$fauxEl.addClass(o.elAttrNames.checkedClass);
				}

				// This applies disabled styled if disabled
				// returns false.
				// If disabled stop running the function
				if(NosUIApp.form.isDisabled(o.dom.$el, o.dom.$fauxEl, o.elAttrNames.disabledClass)){
					return;
				}

				// Event Callback
				if(typeof o.onInit === 'function') {
					o.onInit(o.dom.$el, o.dom.$fauxEl, o);
				}
			}

			function reflectChange() {
				o._stackOverflow++;
				// Faux siblings must be defined after all fauxSiblings hvae been created
				// i.e. on click should be enough time
				o.dom.$fauxSiblings = o.dom.$elContainerForm
					.find('.' + o.elAttrNames.fauxElClass)
					.filter(function(i, el){
						if($(el).data(NosUIApp.namespace + '-name') == o.dom.elName){
							return true;
						} else {
							return false;
						}
					})
					.not(o.dom.$fauxEl);

				// Uncheck siblings
				o.dom.$fauxSiblings.data(NosUIApp.namespace + '-checked', false).removeClass(o.elAttrNames.checkedClass);

				// Check radio
				o.dom.$fauxEl.data(NosUIApp.namespace + '-checked', true).addClass(o.elAttrNames.checkedClass);

				if(typeof o.onChange === 'function' && o._stackOverflow <= 1) {
					o.onChange(o.dom.$el, o.dom.$fauxEl, o);
				}

				o._stackOverflow = 0;
			}

			function events(){
				o.dom.$el.on({
					'change.nosui': reflectChange
				});

				o.dom.$fauxEl.on({
					'click.nosui': function(e){
						// Apply disabled styled if disabled
						// returns false if disabled.
						// If disabled stop running the function
						if(NosUIApp.form.isDisabled(o.dom.$el, o.dom.$fauxEl, o.elAttrNames.disabledClass)){
							return;
						}

						// Uncheck siblings
						o.dom.$elSiblings.prop('checked', false);

						// Check radio
						o.dom.$el.prop('checked', true);

						reflectChange(e);
					},
					'mousedown.nosui': function() {
						// Apply disabled styled if disabled
						// returns false if disabled.
						// If disabled stop running the function
						if(NosUIApp.form.isDisabled(o.dom.$el, o.dom.$fauxEl, o.elAttrNames.disabledClass)){
							return;
						}

						o.dom.$fauxEl.addClass(o.elAttrNames.mousedownClass);

						// Prevent bug where checkbox can be left selected
						$('body').on('mouseup.nosui', function(){
							o.dom.$fauxEl.removeClass(o.elAttrNames.mousedownClass);

							// Remove event
							$('body').off('mouseup.nosui');
						});

						// Event Callback
						if(typeof o.onMousedown === 'function') {
							o.onMousedown(o.dom.$el, o.dom.$fauxEl, o);
						}
					},
					'mouseup.nosui': function() {
						o.dom.$fauxEl.removeClass(o.elAttrNames.mousedownClass);

						// Remove event
						$('body').off('mouseup.nosui');
					}
				});
			}

			init();
			events();
		});

	}, // nosFormRadio()
	nosInputFile: function( options, disableMethod ){

		return this.each(function(){

			var defaults = {
					elAttrNames: {
						'elClass'         : '__element',
						'fauxElClass'     : '',
						'disabledClass'   : '--disabled',
						'buttonClass'     : '__button',
						'placeholderClass': '__placeholder'
					},
					namespace: 'nosui-form-file',
					placeholderText: 'No file chosen',
					buttonText: 'Choose File',
					onInit: null,
					onChange: null
				},
				o = NosUIApp.defineOptions(defaults, options);

			o.dom.$el = $(this);

			// Match element or throw error
			NosUIApp.matchElType($('input[type="file"]'), o.dom.$el);

			if(disableMethod === true){
				disable();
				return;
			}

			function disable(){
				// Changing the data on the element to
				// reflect that it has been disabled
				o.dom.$el.off('change.nosui')
					.removeClass(o.elAttrNames.elClass)
					.siblings().remove() // Remove button/placeholder
					.end().unwrap('.' + o.elAttrNames.fauxElClass); // Remove fauxEl
			}

			function init(){
				o.dom.$el.addClass(o.elAttrNames.elClass);
				o.dom.$fauxEl = $('<div />', {
					'class': o.elAttrNames.fauxElClass
				});
				o.dom.$placeholder = $('<div />', {
					'class': o.elAttrNames.placeholderClass,
					'text': o.placeholderText
				});
				o.dom.$button = $('<div />', {
					'class': o.elAttrNames.buttonClass,
					'text': o.buttonText
				});

				NosUIApp.form.isDisabled(o.dom.$el, o.dom.$fauxEl, o.elAttrNames.disabledClass);

				o.dom.$el.wrap( o.dom.$fauxEl ).before( o.dom.$placeholder, o.dom.$button );

				// Event Callback
				if(typeof o.onInit === 'function') {
					o.onInit(o.dom.$el, o.dom.$fauxEl, o);
				}
			}

			function events(){
				o.dom.$el.on({
					'change.nosui': function(){
						o.dom.$placeholder.text( o.dom.$el.val() );

						if(typeof o.onChange === 'function') {
							o.onChange(o.dom.$el, o.dom.$fauxEl, o);
						}
					}
				});
			}

			init();
			events();

		}); // return this.each

	}, // nosFormRadio()
	nosTooltip: function( options ){

		return this.each(function(){

			var defaults = {
					elAttrNames: {
						'popup'    : 'nosui-tooltip__popup',
						'container': 'nosui-tooltip',
						'dataName' : 'nosui-tooltip'
					},
					text: null
				},
				o          = NosUIApp.defineOptions(defaults, options),
				$el        = $(this),
				$container = $('<div />', {
					'class' : o.elAttrNames.container
				}),
				$tooltip = $('<div />', {
					'class': o.elAttrNames.popup,
					'text' : o.text ? o.text : $el.data(o.elAttrNames.dataName)
				});

			$el.wrap($container).after($tooltip);

		}); // return this.each

	}, // nosTooltip()
	nosResponsiveImages: function( options, disableMethod ){

		var minResponsiveWidth = 0;

		// Sets the data jQuery attributes of the obj
		function setDataAttr($el){
			var attrList = $el.get(0).attributes,
				attrMap = {};

			for (var a = 0; a < attrList.length; a++) {
				var attrKey = attrList[a].name.toLowerCase(),
					attrVal = attrList[a].value;

				if(attrKey.indexOf('data-') !== -1){
					attrKey = attrKey.substring(5);
				} else {
					// Don't add attribute to the list
					continue;
				}

				$el.data(attrKey);
				attrMap[attrKey] = attrVal;
			}

			// If attributes on element exist
			if(!jQuery.isEmptyObject(attrMap)){
				$el.data('src-' + minResponsiveWidth, $el.attr('src'));
				attrMap['src-' + minResponsiveWidth] = $el.attr('src');
			}

			return !jQuery.isEmptyObject(attrMap);
		}

		function setImage(){

			var windowWidth = $(window).width();

			$.each(NosUIApp.elList.responsiveImages, function(i, $respEl){

				var dataAttr = $respEl.data(),
					// Set activeResponseWidth to minimum by default
					activeResponsiveWidth = minResponsiveWidth;

				// For each data-src-num attribute
				$.each(dataAttr, function(k){
					var keyWidth = parseFloat(k.substring(3));

					// If larger than the current `keyWidth` and smaller than
					// the current `windowWidth`
					if(keyWidth >= activeResponsiveWidth && keyWidth <= windowWidth){
						activeResponsiveWidth = keyWidth;
					}
				});

				var newSrc = $respEl.data('src-' + activeResponsiveWidth);

				// Set new image
				$respEl.attr('src', newSrc);
			});
		}

		var $window = $(window),
			lastElIndex = this.length -1,
			scrollTimeout;

		// Always disable resize event incase it runs multiple times
		$window.off('resize.nosui-responsive-image').on('resize.nosui-responsive-image', function(){
			if(typeof scrollTimeout !== 'undefined'){
				window.clearTimeout(scrollTimeout);
			}

			// Set a timeout so the function doesn't run too often
			scrollTimeout = window.setTimeout(setImage, 200);
		});

		// for each item targetted by the user
		return this.each(function(i){

			var defaults = {
				elAttrNames: {
					'elClass': ''
				},
				minResponsiveWidth: 0,
				namespace: 'nosui-responsive-image'
			},
			o = NosUIApp.defineOptions(defaults, options),
			$el = $(this);

			// Disable method if var is true
			if(disableMethod){
				$el.attr('src', $el.data('src-' + minResponsiveWidth)).removeClass(o.elAttrNames.elClass);

				// Remove elements from the list
				NosUIApp.elList.responsiveImages = $.grep( NosUIApp.elList.responsiveImages, function($grepEl){
					return $grepEl.get(0) !== $el.get(0);
				});

				return;
			}

			// Set the jQuery data attr
			var elAttributesExist = setDataAttr($el);

			if(elAttributesExist === false){
				return;
			}

			$el.addClass(o.elAttrNames.elClass);

			NosUIApp.matchElType($('img'), $el);

			// Push $el to the nosui responsive element array
			NosUIApp.elList.responsiveImages.push($el);

			// If this is the last item, set all images to
			// their correct state.
			if(i === lastElIndex){
				setImage();
			}
		});
	},
	nosInputRange: function( options, disableMethod ){
		return this.each(function(){

			var defaults = {
					elAttrNames: {
						'elClass'    : '-element',
						'fauxElClass': '',
						'container'  : '',
						'sliderClass': '__slider',
						'handleClass': '__handle'
					},
					namespace: 'nosui-input-range',
					timeoutThrottle: 0,
					onInit: null,
					onChange: null
				},
				o   = NosUIApp.defineOptions(defaults, options);

			o.dom.$el = $(this);

			// Match element or throw error
			NosUIApp.matchElType($('input'), o.dom.$el);

			if(disableMethod === true){
				disable();
				return;
			}

			function disable(){
				// Changing the data on the element to
				// reflect that it has been disabled
				o.dom.$el.show()
					.prev().off()
					.children().off();
				o.dom.$el.prev().remove();
			}

			// Ensure the value adheres to the max/min values
			function elValueFilter(){
				if(o.valueVal < o.minVal){
					o.valueVal = o.minVal;

					// Correct element value
					o.dom.$el.val(o.valueVal);
				} else if(o.valueVal > o.maxVal){
					o.valueVal = o.maxVal;

					// Correct element value
					o.dom.$el.val(o.valueVal);
				}
			}

			// Define functions
			function nextStep(percVal){
				var stepPerc = (o.stepVal / (o.maxVal - o.minVal)) * 100,
					rem = percVal % stepPerc;

				if (rem <= (stepPerc/2)) {
					return percVal - rem;
				} else {
					return percVal + stepPerc - rem;
				}
			}

			function setPosition(xPos) {
				var fauxElWidth = o.dom.$fauxEl.width(),
					// Get percentage value
					xPerc = (xPos/fauxElWidth) * 100,
					// Filter the percentage through the step
					xPercNext = nextStep(xPerc);

				if(xPercNext < 0){
					xPercNext = 0;
				} else if(xPercNext > 100){
					xPercNext = 100;
				}

				// Get correct slider value
				o.valueVal = Math.round(((o.maxVal - o.minVal) * xPercNext/100) + o.minVal);
				elValueFilter();

				// Set val and trigger change for external plugins
				o.dom.$el.val(o.valueVal).trigger('change');

				o.dom.$handle.css('left', xPercNext + '%');

				// onChange
				if(typeof o.onChange === 'function') {
					o.onChange(o.dom.$el, o.dom.$fauxEl, o);
				}
			}

			function reflectInputVal() {
				o.valueVal = o.dom.$el.val();
				elValueFilter();

				var valPos = nextStep(
					((o.valueVal - o.minVal) / (o.maxVal - o.minVal)) * 100 // percentage val
				);

				o.dom.$handle.css('left', valPos + '%');
			}

			function init() {
				// Setting options
				o.stepVal = o.dom.$el.attr('step') ? parseFloat(o.dom.$el.attr('step')) : 1;
				// Set default min/max val whether it's been set or not
				o.minVal = o.dom.$el.attr('min') ? parseFloat(o.dom.$el.attr('min')) : 0;
				o.maxVal = o.dom.$el.attr('max') ? parseFloat(o.dom.$el.attr('max')) : 100;
				if(o.minVal > o.maxVal){
					o.maxVal = o.minVal;
				}
				// According to MDN (https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Input)
				// value: min + (max-min)/2, or min if max is less than min
				o.valueVal = o.dom.$el.val() ? parseFloat(o.dom.$el.val()) : o.minVal + (o.maxVal - o.minVal)/2;
				elValueFilter();

				// Setting variables
				o.dom.$fauxEl = $('<div />', {
						'class': o.elAttrNames.fauxElClass
					});
				o.dom.$slider = $('<div />', {
						'class': o.elAttrNames.sliderClass
					}).appendTo(o.dom.$fauxEl);
				o.dom.$handle = $('<div />', {
						'class': o.elAttrNames.handleClass
					}).appendTo(o.dom.$fauxEl);

				// Dom manipulation and events
				o.dom.$el.hide().addClass(o.elAttrNames.elClass).val(o.valueVal).on({
					'change.nosui': reflectInputVal
				});
				o.dom.$fauxEl.on({
					'click.nosui': function(e){
						var xPos = e.pageX - o.dom.$fauxEl.offset().left;
						setPosition(xPos);
					}
				}).insertBefore( o.dom.$el );

				// Set init slider position based on el
				reflectInputVal(o.valueVal);

				o.dom.$handle.on({
					'click.nosui': function(e){
						e.preventDefault();
						e.stopPropagation();
					},
					'mousedown.nosui': function(e){
						e.preventDefault();

						o.dom.$el.off('change.nosui');

						$('body').on({
							'mousemove.nosui': function(e){
								e.preventDefault(); // prevent text selection

								if(typeof o.timeoutThrottle !== 'undefined'){
									window.clearTimeout(o.timeoutThrottle);
								}

								o.timeoutThrottle = window.setTimeout(function(){
									// Get scroll handle percentage form left val
									var xPos = e.pageX - o.dom.$fauxEl.offset().left;

									setPosition(xPos);
								}, 5);
							}
						});

						$('body').on('mouseup.nosui', function(){
							$('body').off('mousemove.nosui');
							$('body').off('mouseup.nosui');

							// Turn reflection back on
							o.dom.$el.on('change.nosui', reflectInputVal);
						});
					}
				});

				// onInit
				if(typeof o.onInit === 'function') {
					o.onInit(o.dom.$el, o.dom.$fauxEl, o);
				}
			} // init

			init();
		});
	}
});

})( jQuery );