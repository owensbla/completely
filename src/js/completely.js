/*  ========================================================================
 *  Completely.js v1.1
 *  http://owensbla.github.com/completelyjs
 *
 *  Plugin boilerplate provied by: http://jqueryboilerplate.com/
 *  ========================================================================
 *  Copyright 2013 Blake Owens (http://blakeowens.com/)
 *  
 *  Permission is hereby granted, free of charge, to any person obtaining a copy of this software
 *  and associated documentation files (the 'Software'), to deal in the Software without restriction,
 *  including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
 *  and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, 
 *  subject to the following conditions:
 *  
 *  The above copyright notice and this permission notice shall be included in all copies or 
 *  substantial portions of the Software.
 *  
 *  THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT 
 *  LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 *  IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, 
 *  WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE 
 *  SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *  ======================================================================== */

;(function ($, window, document, undefined) {

    'use strict';

    var pluginName = 'completely';
    var defaults = {
        addOnClose: false,
        ajaxOptions: {},
        ajaxUrl: false,
        ajaxThrottleTime: 200,
        allowClear: false,
        allowInput: true,
        classes: {
            _anchoredAboveClass: 'completely-top',
            _arrowClass: 'completely-arrow',
            _disabledClass: 'completely-disabled',
            inputClass: 'completely-input',
            inputContainerClass: 'completely-input-container',
            _loadingClass: 'completely-loading',
            _markedForDeletionClass: 'completely-delete',
            maskClass: 'completely-mask',
            matchedResultClass: 'completely-match',
            multipleSelectClass: 'completely-multiple',
            offscreenClass: 'completely-offscreen',
            placeholderClass: 'completely-placeholder',
            _removeSelectionClass: 'completely-remove-selection',
            resultClass: 'completely-result',
            resultsContainerClass: 'completely-results-container',
            resultsListClass: 'completely-results',
            _searchIconClass: 'completely-search-icon',
            selectClass: 'completely-select',
            _selectableResultClass: 'can-select',
            selectedResultClass: 'completely-selected',
            selectionListClass: 'completely-selections',
            selectionClass: 'completely-selection',
            singleSelectClass: 'completely-single'
        },
        clearOnEsc: true,
        closeOnAdd: false,
        copyClasses: true,
        custom: false,
        events: {
            onOpen: function() {},
            onClose: function() {},
            onAddResult: function() {},
            onRemoveResult: function() {},
            onAddSelection: function() {},
            onRemoveSelection: function() {},
            onSync: function() {}
        },
        minimumAjaxLength: 3,
        placeholder: 'Please select an option...',
        setWidth: true,
        sort: true
    };
    var KEY = {
        BACKSPACE: 8,
        TAB: 9,
        ENTER: 13,
        ESC: 27,
        SPACE: 32,
        UP: 38,
        DOWN: 40,
        COMMA: 188,
        SHIFT: 16
    };

    // Helpers
    function escapeString(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    function parseString(s) {
        return s.replace('<', '&lt;').replace('>', '&gt;');
    }

    function Completely(originalSelect, options) {
        this.originalSelect = originalSelect;
        this.$originalSelect = $(this.originalSelect);

        this.options = $.extend({}, defaults, options, this.$originalSelect.data());
        this.options.multiple = this.$originalSelect.prop('multiple');
        this.options.classes = $.extend({}, defaults.classes, typeof options.classes === 'undefined' ? {} : options.classes);
        this.options.events = $.extend({}, defaults.events, typeof options.events === 'undefined' ? {} : options.events);

        this._defaults = defaults;
        this._name = pluginName;
        this.init();
    }

    Completely.prototype = {
        /* Initialize Completely. */
        init: function () {
            this.$originalSelect.attr('tabindex', -1);

            // Setup class/state variables.
            this.active = false;
            this.selectionsCache = {};
            this.optionsCache = {};
            this.resultsCache = {};
            this.searchCache = {};
            this.query = '';

            // Setup the plugin
            this._setupCompletely();

            // Complete the setup.
            this._bindEvents();
        },

        /* Sets up Completely. */
        _setupCompletely: function() {
            this._createSelect();
            this._createMask();
            this._createOptions();
            this._initializeResultsList();
            this._createInput();
            this._createPlaceholder();
            this._addPlaceholder();
        },

        /* Inserts the new Completely container before the <select> element
         * and hides the original <select> element.
         *
         * Assigns this.$completelySelect to the new completely container's jQuery reference.
         * Assigns this.$selectionList to the selected list's jQuery reference.
         */
        _createSelect: function() {
            var $completelySelect,
                $selectionList,
                $arrow;

            $completelySelect = $('<div />', {
                'class': this.options.classes.selectClass,
                'tabindex': 0
            });

            if (this.options.copyClasses) { $completelySelect.addClass(this.$originalSelect.attr('class')); }
            if (this.options.setWidth) {
                $completelySelect.css({ 'width': this.$originalSelect.outerWidth() });
            } else {
                $completelySelect.css({ 'width': '100%' });
            }
            if (this.options.multiple) {
                $completelySelect.addClass(this.options.classes.multipleSelectClass);

                $selectionList = $('<ul />', {
                    'class': this.options.classes.selectionListClass
                });
                $selectionList.appendTo($completelySelect);
            } else {
                $selectionList = $('<div />', {
                    'class': this.options.classes.singleSelectClass
                });
                $selectionList.appendTo($completelySelect);
            }

            $arrow = $('<div />', {
                'class': this.options.classes._arrowClass
            });
            $arrow.appendTo($completelySelect);

            $completelySelect.insertBefore(this.$originalSelect);

            this.$originalSelect.addClass(this.options.classes.offscreenClass);

            this.$completelySelect = $completelySelect;
            this.$selectionList = $selectionList;
        },

        /* Creates the Completely mask.
         * 
         * Assigns this.$mask to the mask's jQuery reference.
         */
        _createMask: function() {
            var $mask;

            $mask = $('<div />', {
                'class': this.options.classes.maskClass
            });

            this.$mask = $mask;
        },

        /* Creates the Completely input and appends it to 
         * $completelySelect if it's a multiple select or
         * $resultsContainer if it's a regular select.
         * 
         * Assigns this.$input to the input's jQuery reference.
         */
        _createInput: function() {
            var $input,
                $inputContainer,
                $icon;

            $input = $('<input />', {
                'class': this.options.classes.inputClass
            });

            $inputContainer = $('<div />').addClass(this.options.classes.inputContainerClass);
            if (this.options.allowInput) { $input.appendTo($inputContainer); }

            $inputContainer.prependTo(this.$resultsContainer);

            $icon = $('<div />', {
                'class': this.options.classes._searchIconClass
            });
            if (this.options.allowInput) { $icon.appendTo($inputContainer); }

            this.$input = $input;
            this.$searchIcon = $icon;
        },

        /* Creates and caches the options from the inital select object. */
        _createOptions: function () {
            var _this = this,
                children = this.$originalSelect.children(),
                $child,
                key, value;

            $.each(children, function() {
                $child = $(this);
                if ($child.is('option')) {
                    key = $child.val();
                    value = $child.text();
                    _this._createOption(key, value);

                    if (typeof $child.attr('selected') !== 'undefined') {
                        _this._createSelection(_this.optionsCache[key]);
                    }
                } else if ($child.is('optgroup')) {
                    // TODO: optgroup support
                }
            });

            if (this.options.custom) {
                this._createOption('completelyCustom', '');
            }
        },

        /* Generates the inital list of results.
         * 
         * Assigns this.$resultsContainer to the options container's jQuery reference.
         * Assigns this.$resultsList to the options list's jQuery reference.
         */
        _initializeResultsList: function () {
            var $resultsContainer,
                $resultsList,
                _this = this;

            $resultsContainer = $('<div />', {
                'class': this.options.classes.resultsContainerClass
            });

            $resultsList = $('<ul />', {
                'class': this.options.classes.resultsListClass
            });

            $resultsList.appendTo($resultsContainer);

            this.$resultsContainer = $resultsContainer;
            this.$resultsList = $resultsList;

            $.each(this.optionsCache, function(key, obj) {
                if (key === 'completelyCustom') { return true; } // don't add the custom result yet.
                _this.addResult(obj);
            });
        },

        /* Bind the events for Completely elements. */
        _bindEvents: function() {
            var _this = this,
                cachedObj;

            // Completely container events
            this.$completelySelect.on('click', $.proxy(function() {
                if (_this.$completelySelect.hasClass(_this.options.classes._disabledClass)) { return; }
                this.toggleCompletely();
            }, this));

            this.$completelySelect.on('keydown', $.proxy(function(e) {
                var key = e.which;
                if (key === KEY.ENTER || key === KEY.DOWN || key === KEY.UP || (key > 64 && key < 91)) {
                    this.showCompletely();
                }
                switch (key) {
                case KEY.DOWN:
                    this._setSelectedResult(this.nextResult(), true);
                    break;
                case KEY.UP:
                    this._setSelectedResult(this.prevResult(), true);
                    break;
                case KEY.ESC:
                case KEY.BACKSPACE:
                    e.preventDefault();
                    this.clearSelection();
                    break;
                }
            }, this));

            this.$completelySelect.on('blur', $.proxy(function() {
                this._reset();
            }, this));

            this.$completelySelect.on('selectionAdded selectionRemoved', $.proxy(function() {
                this._setResultsListPosition();
            }, this));

            // Input events
            this.$input.on('keydown', $.proxy(function(e) {
                switch (e.which) {
                case KEY.SHIFT:
                    this.shiftPressed = true;
                case KEY.UP:
                    this._setSelectedResult(this.prevResult(), true);
                    break;
                case KEY.DOWN:
                    this._setSelectedResult(this.nextResult(), true);
                    break;
                case KEY.ENTER:
                case KEY.COMMA:
                    if (this.shiftPressed) { return; }
                    e.preventDefault();
                    cachedObj = this._getCachedObjectForElement(this.getSelectedResult());
                    if (cachedObj) {
                        this.addSelection(cachedObj);
                        this._handleCustomResult();
                    }
                    break;
                case KEY.ESC:
                case KEY.TAB:
                    e.stopImmediatePropagation();
                    if (this.options.addOnClose) {
                        cachedObj = this._getCachedObjectForElement(this.getSelectedResult());
                        if (cachedObj) {
                            this.addSelection(cachedObj);
                            this._handleCustomResult();
                        }
                    }
                    this.hideCompletely();
                    break;
                case KEY.BACKSPACE:
                    if (this.$input.val().length === 0) { this.clearSelection(); }
                }
            }, this));

            this.$input.on('keyup', $.proxy(function(e) {
                switch (e.which) {
                case KEY.SHIFT:
                    this.shiftPressed = false;
                case KEY.UP:
                case KEY.DOWN:
                case KEY.ENTER:
                case KEY.COMMA:
                case KEY.TAB:
                case KEY.ESC:
                    return;
                }

                this._generateList();
                this._fetchResults();
            }, this));

            // Mask events
            this.$mask.on('click', $.proxy(function() {
                if (this.options.multiple && this.options.addOnClose && $.trim(this.$input.val()) !== '') {
                    var obj = {
                        key: $.trim(this.$input.val()),
                        value: $.trim(this.$input.val())
                    };
                    this.addSelection(obj);
                }
                this.hideCompletely();
            }, this));

            // Options list events
            this.$resultsList.on('click', '.' + this.options.classes._selectableResultClass, function() {
                _this.addSelection(_this.resultsCache[this.getAttribute('data-key')]);

                if (!_this.options.multiple || (_this.options.multiple && _this.options.closeOnAdd)) {
                    _this.hideCompletely();
                } else {
                    _this.$input.focus();
                }
            });

            this.$resultsList.on('mouseenter',
                '.' + this.options.classes._selectableResultClass,
                function(e) {
                    _this._setSelectedResult($(e.currentTarget));
                }
            );

            // Selection list events
            this.$selectionList.on('click', '.' + this.options.classes._removeSelectionClass, function(e) {
                e.stopPropagation();
                if (_this.$completelySelect.hasClass(_this.options.classes._disabledClass)) { return; }
                _this.removeSelection($(this).parent());
            });
        },

        /* Creates the option list item and adds it to this.optionsCache
         * 
         * @param key (string): The key of the option.
         * @param value (string): The value of the option.
         *
         * @returns the cached option.
         */
        _createOption: function(key, value) {
            if (this.hasOption(key)) { return this.optionsCache[key]; }

            var $el;

            $el = $('<li />')
                .html(value)
                .attr('data-key', key)
                .addClass(this.options.classes.resultClass)
                .addClass(this.options.classes._selectableResultClass);

            this.optionsCache[key] = {
                key: key,
                value: value,
                $el: $el
            };

            return this.optionsCache[key];
        },

        /* Creates the placeholder element and assigns it to this.$placeholder */
        _createPlaceholder: function() {
            var $placeholder;

            if (this.options.multiple) {
                $placeholder = $('<li />');
            } else {
                $placeholder = $('<p />');
            }

            $placeholder.addClass(this.options.classes.placeholderClass)
                        .text(this.options.placeholder);

            this.$placeholder = $placeholder;
        },

        /* Adds the placeholder text if there are no selections. */
        _addPlaceholder: function() {
            if (this.getSelections().length > 0) { return; }

            this.$placeholder.appendTo(this.$selectionList);
        },

        /* Detaches the placeholder text if there are some selections. */
        _removePlaceholder: function() {
            if (this.getSelections().length === 0) { return; }

            this.$placeholder.detach();
        },

        /* Perform all necessary steps to show the Completely list and triggers events. */
        showCompletely: function() {
            this.active = true;
            this.$completelySelect.addClass('active');
            this._showResultsList();
            this._showMask();
            this.$input.focus();

            this._generateList();

            // Trigger events
            this.options.events.onOpen.call(this);
        },

        /* Perform all necessary steps to hide the Completely list and triggers events. */
        hideCompletely: function() {
            this.active = false;
            this.$completelySelect.removeClass('active');
            this.$completelySelect.focus();
            this._hideResultsList();
            this._hideMask();
            this._reset();
            this.$input.blur();

            // Trigger events
            this.options.events.onClose.call(this);
        },

        /* Toggles this Completely object. */
        toggleCompletely: function() {
            if (this.active) {
                this.hideCompletely();
            } else {
                this.showCompletely();
            }
        },

        /* Attaches $mask to the DOM. */
        _showMask: function() {
            this.$mask.css({
                'width': $(document).width(),
                'height': $(document).height()
            });
            this.$mask.appendTo('body');
        },

        /* Detaches $mask from the DOM. */
        _hideMask: function() {
            this.$mask.detach();
        },

        /* Sets the position of $resultsContainer. */
        _setResultsListPosition: function() {
            var coords,
                containerWidth,
                containerHeight,
                choicesHeight;

            coords = this.$completelySelect.offset();
            containerWidth = this.$completelySelect.outerWidth();
            containerHeight = this.$completelySelect.outerHeight();
            choicesHeight = this.$resultsContainer.outerHeight();

            if (coords.top + containerHeight + choicesHeight > $(window).height() &&
                coords.top - choicesHeight > 0) {
                coords.top = coords.top - choicesHeight;
            } else {
                coords.top = coords.top + containerHeight;
            }

            this.$resultsContainer.css(coords);

            if (coords.top < this.$completelySelect.offset().top) {
                this.$completelySelect.addClass(this.options.classes._anchoredAboveClass);
                this.$resultsContainer.addClass(this.options.classes._anchoredAboveClass);
            } else {
                this.$completelySelect.removeClass(this.options.classes._anchoredAboveClass);
                this.$resultsContainer.removeClass(this.options.classes._anchoredAboveClass);
            }
        },

        /* Attaches $resultsContainer to the DOM. */
        _showResultsList: function() {
            this.$resultsContainer.appendTo('body');

            this._setResultsListPosition();
            this.$resultsContainer.css({
                'width': this.$completelySelect.outerWidth()
            });
        },

        /* Detaches $resultsContainer from the DOM. */
        _hideResultsList: function() {
            this.$resultsContainer.detach();
        },

        /* Returns the cached object given an element.
         *
         * @param (object): a selectable list item jQuery object.
         * @returns the cached option
         */
        _getCachedObjectForElement: function($el) {
            if ($el === false) { return false; }

            return this.hasResult($el.attr('data-key')) ? this.resultsCache[$el.attr('data-key')] : false;
        },

        /* Clear marked elements. */
        _reset: function() {
            this.$completelySelect.find('.' + this.options.classes._markedForDeletionClass)
                .removeClass(this.options.classes._markedForDeletionClass);

            this._setSelectedResult(this.firstResult());

            this.$input.val('');
        },

        /* Scrolls to selected element */
        _setScrollPosition: function() {
            var $selected = this.getSelectedResult(),
                scrollTop = this.$resultsList.scrollTop();

            if (typeof $selected[0] === 'undefined') { return; }

            if ($selected[0] === this.firstResult()[0] && scrollTop !== 0) {
                this.$resultsList.scrollTop(0);
                return;
            }

            var selectedOffset = $selected.offset(),
                selectedHeight = $selected.outerHeight(),
                listOffset = this.$resultsList.offset(),
                listHeight = this.$resultsList.outerHeight(),
                selectedTop;

            selectedTop = selectedOffset.top - listOffset.top;

            if (selectedTop + selectedHeight > listHeight) {
                this.$resultsList.scrollTop(scrollTop + selectedHeight);
            }

            if (selectedOffset.top < listOffset.top) {
                this.$resultsList.scrollTop(scrollTop - selectedHeight);
            }
        },

        /* Remove selected class from currently selected element */
        _clearSelectedOption: function() {
            this.$resultsList.find('.' + this.options.classes.selectedResultClass)
                .removeClass(this.options.classes.selectedResultClass);
        },

        /* Regenerates the results list. */
        _generateList: function() {
            this.query = $.trim(this.$input.val());
            this._filterResults();
            this._sortResults();
            this._handleCustomResult();
            this._formatResults();
            this._setSelectedResult(this.firstResult(), true);
            this._setResultsListPosition();
        },

        /* Fetches remote data. */
        _fetchResults: function() {
            if (!this.options.ajaxURL ||
                this.query.length < this.options.minimumAjaxLength ||
                this.query in this.searchCache) { return; }

            clearTimeout(this.ajaxTimeout);
            this.ajaxTimeout = setTimeout($.proxy(function() {
                this.searchCache[this.query] = this.query;

                var options = $.extend({}, this.options.ajaxOptions),
                    url = this.options.ajaxURL,
                    _this = this,
                    results;

                options.data = typeof options.data !== 'undefined' ? options.data.call(this, this.query) : {};

                this.$searchIcon.addClass(this.options.classes._loadingClass);
                if ($.trim(this.$input.val()).length < this.options.minimumAjaxLength) { return; }
                $.ajax(url, options).done(function(data) {
                    results = options.results.call(_this, data);

                    for (var i = 0; i < results.length; i++) {
                        if (typeof results[i] === 'string') {
                            _this._createOption(results[i], results[i]);
                        } else {
                            _this._createOption(results[i].key, results[i].value);
                        }
                    }
                    _this._generateList();
                }).always(function() {
                    _this.$searchIcon.removeClass(_this.options.classes._loadingClass);
                });
            }, this), this.options.ajaxThrottleTime);
        },

        /* Filters the options list by this input */
        _filterResults: function() {
            var q = this.query,
                index;

            // Add options
            $.each(this.optionsCache, $.proxy(function(key, obj) {
                index = obj.value.toLowerCase().search(escapeString(q.toLowerCase()));

                if (index !== -1 && obj.value !== '') {
                    this.addResult(obj);
                }
            }, this));

            // Remove options
            $.each(this.resultsCache, $.proxy(function(key, obj) {
                index = obj.value.toLowerCase().search(escapeString(q.toLowerCase()));

                if (index === -1) {
                    this.removeResult(obj);
                }
            }, this));
        },

        /* Add/remove the custom result. */
        _handleCustomResult: function() {
            if (!this.options.custom) { return; }

            var q = this.query,
                $el;

            if (this.options.custom && q !== '' && !this.hasSelection(q)) {
                this.optionsCache.completelyCustom.value = q;
                $el = this.addResult(this.optionsCache.completelyCustom).$el;
                $el.prependTo(this.$resultsList);
            } else {
                this.optionsCache.completelyCustom.value = '';
                this.removeResult(this.optionsCache.completelyCustom);
            }
        },

        /* Basic sorting of results list */
        _sortResults: function() {
            if (!this.options.sort) { return; }

            var results;

            results = this.$resultsList.children('.' + this.options.classes._selectableResultClass);
            results = results.sort(function(a, b) {
                a = a.textContent.toLowerCase();
                b = b.textContent.toLowerCase();

                if (a > b) {
                    return 1;
                } else if (a < b) {
                    return -1;
                } else {
                    return 0;
                }
            });
            this.$resultsList.html(results);
        },

        /* Formats the results, underlining matched terms. */
        _formatResults: function() {
            var q = this.query,
                text, index, $span, $result;

            $.each(this.resultsCache, $.proxy(function(key, obj) {
                $result = obj.$el;
                text = obj.value;
                index = text.toLowerCase().search(escapeString(q.toLowerCase()));

                $span = $('<span />', {
                    'class': this.options.classes.matchedResultClass
                });
                $span.text(text.substr(index, q.length));

                $result.html('');
                $result.append($span);
                $result.prepend(text.substr(0, index));
                $result.append(text.substr(index + q.length));
            }, this));
        },

        /* Checks for the @result string in this.resultsCache.
         *
         * @param result (string): The key to check for in this.resultsCache
         * @returns boolean
         */
        hasResult: function(result) {
            return typeof this.resultsCache[result] !== 'undefined';
        },

        /* Adds an item to the results list.
         * 
         * @param option (object): cached object to add.
         * 
         * @returns the results cache object
         */
        addResult: function(option) {
            if (this.hasResult(option.key)) { return this.resultsCache[option.key]; }

            option.$el.appendTo(this.$resultsList);
            this.resultsCache[option.key] = option;

            return this.resultsCache[option.key];
        },

        /* Removes a result from the list.
         *
         * @param option (object): cached option to remove
         */
        removeResult: function(option) {
            if (!this.hasResult(option.key)) { return; }

            delete this.resultsCache[option.key];
            option.$el.detach();
        },

        /* Marks a result as selected. This does NOT actually select an result.
         *
         * @param (jQuery object): the jQuery object of the result to select
         * @param (bool) optional: true/false set scroll position
         */
        _setSelectedResult: function($result, scroll) {
            if ($result === false) { return; }

            this._clearSelectedOption();
            $result.addClass(this.options.classes.selectedResultClass);

            if (typeof scroll !== 'undefined' && scroll) { this._setScrollPosition(); }
        },

        /* Finds and returns the previous selectable option.
         *
         * @returns jQuery object of current selected option.
         */
        getSelectedResult: function() {
            var $result = this.$resultsList.find('.' + this.options.classes.selectedResultClass);

            return typeof $result[0] === 'undefined' ? false : $result;
        },

        /* Finds and returns the first selectable option.
         *
         * @returns jQuery object of next selectable option.
         */
        firstResult: function() {
            var $result = this.$resultsList.find('.' + this.options.classes._selectableResultClass).first();

            return typeof $result[0] === 'undefined' ? false : $result;
        },

        /* Finds and returns the last selectable option.
         *
         * @returns jQuery object of next selectable option.
         */
        lastResult: function() {
            var $result = this.$resultsList.find('.' + this.options.classes._selectableResultClass).last();

            return typeof $result[0] === 'undefined' ? false : $result;
        },

        /* Finds and returns the next selectable option.
         *
         * @returns jQuery object of next selectable option.
         */
        nextResult: function() {
            var $result = this.$resultsList
                    .find('.' + this.options.classes.selectedResultClass)
                    .next('.' + this.options.classes._selectableResultClass);

            return typeof $result[0] === 'undefined' ? false : $result;
        },

        /* Finds and returns the previous selectable option.
         *
         * @returns jQuery object of previous selectable option.
         */
        prevResult: function() {
            var $result = this.$resultsList
                    .find('.' + this.options.classes.selectedResultClass)
                    .prev('.' + this.options.classes._selectableResultClass);

            return typeof $result[0] === 'undefined' ? false : $result;
        },

        /* Checks for the @option string in this.optionsCache.
         *
         * @param option (string): The key to check for in this.optionsCache
         * @returns boolean
         */
        hasOption: function(option) {
            return typeof this.optionsCache[option] !== 'undefined';
        },

        /* Creates a new selection object and return the cached object.
         * 
         * @param key (object): An object with key and value properties.
         *
         * @returns the cached object.
         */
        _createSelection: function(obj) {
            if ($.trim(obj.value) === '') { return false; }
            if (!this.hasOption(obj.key) && !this.options.custom) { return false; }
            if (this.hasSelection(obj.key)) { return this.selectionsCache[obj.key]; }

            var $selection, $remove;

            $remove = $('<a />', {
                'href': 'javascript:void(0);',
                'class': this.options.classes._removeSelectionClass,
                'tabindex': '-1'
            });

            if (this.options.multiple) {
                $selection = $('<li />')
                    .html('<div>' + parseString(obj.value) + '</div>')
                    .attr('data-key', obj.key)
                    .addClass(this.options.classes.selectionClass);

                $remove.prependTo($selection);
                $selection.appendTo(this.$selectionList);
            } else {
                this.selectionsCache = {}; // clear cached, only 1 allowed
                $selection = $('<p />')
                    .html('<div>' + parseString(obj.value) + '</div>')
                    .attr('data-key', obj.key)
                    .addClass(this.options.classes.selectionClass);

                if (this.options.allowClear) { $remove.appendTo($selection); }
                this.$selectionList.html($selection);
            }

            this.selectionsCache[obj.key] = {
                key: obj.key,
                value: obj.value,
                $el: $selection
            };

            return this.selectionsCache[obj.key];
        },

        /* Selects an item and adds it to this.selectionsCache.
         * 
         * @param key (object): An object with key and value properties.
         *
         * @returns the cached object.
         */
        addSelection: function(obj) {
            var $selection, $selected, cachedSelection,
                _this = this;

            if (obj.key === 'completelyCustom') {
                if ($.trim(this.$input.val()).split(',').length > 1) {
                    var objs = $.trim(this.$input.val()).split(',');
                    $.each(objs, function(key, value) {
                        _this.addSelection({
                            key: $.trim(value),
                            value: $.trim(value)
                        });
                    });
                    return;
                } else {
                    obj = {
                        key: $.trim(this.$input.val()),
                        value: $.trim(this.$input.val())
                    };
                }
            }

            cachedSelection = this._createSelection(obj);
            $selected = cachedSelection.$el;

            this.$input.val('');
            this._generateList();

            if (!this.options.multiple || (this.options.multiple && this.options.closeOnAdd)) {
                this.hideCompletely();
            }

            this._removePlaceholder();
            this.options.events.onAddSelection.call(this, obj, this.$originalSelect);
            this.$completelySelect.trigger('selectionAdded');

            if (!this.options.multiple) { this.$originalSelect.val(obj.key); }
            this.$originalSelect.trigger('change');

            return cachedSelection;
        },

        /* Removes a selection from the list.
         *
         * @param selection (string, element):
         *      string - Key for the selection to remove.
         *      element - The element to remove.
         */
        removeSelection: function(selection) {
            var $selection;
            if (typeof selection === 'string') {
                selection = this.$completelySelect.find('li[data-key="' + selection + '"]');
            }
            $selection = $(selection);

            if (!$selection.length) { return; }

            delete this.selectionsCache[$selection.attr('data-key')];
            $selection.remove();

            this._addPlaceholder();
            this.options.events.onRemoveSelection.call();
            this.$completelySelect.trigger('selectionRemoved');

            if(!this.options.multiple) { this.$originalSelect.val(''); }
            this.$originalSelect.trigger('change');
        },

        /* Removes the most recent selection. */
        clearSelection: function() {
            if (!this.options.clearOnEsc || !this.options.allowClear) { return; }
            var $el;

            $el = this.$completelySelect.find('.' + this.options.classes.selectionClass).last();

            if ($el.hasClass(this.options.classes._markedForDeletionClass)) {
                this.removeSelection($el);
            } else {
                $el.addClass(this.options.classes._markedForDeletionClass);
            }
        },

        clearSelections: function() {
            var _this = this,
                $els, $el;

            $els = this.$completelySelect.find('.' + this.options.classes.selectionClass);

            $.each($els, function(index, el) {
                $el = $(el);
                _this.removeSelection($el);
            });
        },

        /* Checks for the @selection string in this.selectionsCache.
         *
         * @param selection (string): The key to check for in this.selectionsCache
         * @returns boolean
         */
        hasSelection: function(selection) {
            return typeof this.selectionsCache[selection] !== 'undefined';
        },


        /* @returns the 'value' values for this.selectionsCache */
        getSelections: function(returnKeys) {
            returnKeys = typeof returnKeys === 'boolean' ? returnKeys : false;
            var values = [];

            for (var key in this.selectionsCache) {
                if (this.selectionsCache.hasOwnProperty(key)) {
                    if (returnKeys) {
                        values.push({
                            key: key,
                            value: this.selectionsCache[key].value
                        });
                    } else {
                        values.push(this.selectionsCache[key].value);
                    }
                }
            }

            return values;
        },

        /* Focuses the completely select. */
        focusCompletely: function() {
            this.$completelySelect.focus();
        },

        /* Enabled Completely */
        enable: function() {
            this.$completelySelect.removeClass(this.options.classes._disabledClass);
        },

        /* Disables Completely */
        disable: function() {
            this.$completelySelect.addClass(this.options.classes._disabledClass);
        },

        /* Destroy completely */
        destroy: function() {
            this.$originalSelect.removeClass(this.options.classes.offscreenClass);
            this.$originalSelect.removeData('plugin_' + pluginName);

            this.$completelySelect.off();
            this.$completelySelect.remove();

            this.$input.off();
            this.$input.remove();

            this.$mask.off();
            this.$mask.remove();

            this.$resultsList.off();
            this.$resultsList.remove();

            this.$selectionList.off();
            this.$selectionList.remove();

            this.$searchIcon.remove();
            this.$resultsContainer.remove();

            delete this.searchCache;
            delete this.optionsCache;
            delete this.resultsCache;
        }
    };

    $.fn[pluginName] = function (options, args) {
        if (typeof options === 'string') {
            var ret;

            switch (options) {
            case 'val':
                this.each(function() { ret = $.data(this, 'plugin_' + pluginName).getSelections(args); });
                break;
            case 'show':
                this.each(function() { $.data(this, 'plugin_' + pluginName).showCompletely(); });
                break;
            case 'focus':
                this.each(function() { $.data(this, 'plugin_' + pluginName).focusCompletely(); });
                break;
            case 'hide':
                this.each(function() { $.data(this, 'plugin_' + pluginName).hideCompletely(); });
                break;
            case 'destroy':
                this.each(function() { $.data(this, 'plugin_' + pluginName).destroy(); });
                ret = true; // add a return value so we don't reinitialize the plugin
                break;
            case 'toggle':
                this.each(function() { $.data(this, 'plugin_' + pluginName).toggleCompletely(); });
                break;
            case 'getSelectedResult':
                this.each(function() { ret = $.data(this, 'plugin_' + pluginName).getSelectedResult(); });
                break;
            case 'addResult':
                this.each(function() { $.data(this, 'plugin_' + pluginName).addResult(args); });
                break;
            case 'removeResult':
                this.each(function() { $.data(this, 'plugin_' + pluginName).removeResult(args); });
                break;
            case 'addSelection':
                this.each(function() { $.data(this, 'plugin_' + pluginName).addSelection(args); });
                break;
            case 'removeSelection':
                this.each(function() { $.data(this, 'plugin_' + pluginName).removeSelection(args); });
                break;
            case 'clearSelections':
                this.each(function() { $.data(this, 'plugin_' + pluginName).clearSelections(); });
                break;
            case 'enable':
                this.each(function() { $.data(this, 'plugin_' + pluginName).enable(); });
                break;
            case 'disable':
                this.each(function() { $.data(this, 'plugin_' + pluginName).disable(); });
                break;
            }

            if (typeof ret !== 'undefined') { return ret; }
        }
        return this.each(function () {
            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' + pluginName, new Completely(this, options));
            }
        });
    };

})(jQuery, window, document);