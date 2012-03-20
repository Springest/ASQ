/**
 * Autosuggest jQuery Plugin
 * Accepts the following options as object in first argument:
 * api - [STRING] URL with %s on place where encoded search term will be placed
 * dropdownClass - [STRING] the class given tot the dropdown element
 * logos - [BOOL/STRING] identifier for the one that needs to get logos
 * maxAmount - [INT] maximum amount of items
 * sections - [OBJECT] keys are what the API returns, values the display name
 * searchText - [STRING] the linktekst for real search
 * searchUrl - [STRING] the URL for search, with %s in place where encoded terms will be placed
 */
(function($) {
    var dropdownElm = null;

    $.fn.autosuggest = function(options) {
        var defaults = {
                api: null,
                clickLinkCallback: null,
                dropdownClass: 'dropdown'
            },
            elms = this,
            elm = null,
            highestIndex = 0,
            width = 0,
            focussed = false;


        $.extend(defaults, options);


        if (defaults.api === null) return elm;


        elms.keyup(typeCheck);
        elms.attr('autocomplete', 'off');


        /* Called on keyup in search box; updown/moves focus in dropdown; ESC closes dropdown; others call API */
        function typeCheck(e) {
            elm = $(this);

            switch (e.which) {
                case 27:
                    if (dropdownElm)
                        dropdownElm.addClass('hide');
                    break;
                case 38:
                    e.preventDefault();
                    selectLink('last');
                    break;
                case 40:
                    e.preventDefault();
                    selectLink('first');
                    break;
                default:
                    positionDrowndown($(this));
                    break;
            }
        }


        /* Gets the position of box and places dropdown underneath it. Also does Ajax call to API. */
        function positionDrowndown(elm) {
            if (!dropdownElm) {
                dropdownElm = $('<div class="' + defaults.dropdownClass + ' hide">' +
                    '<div>' +
                    '</div>' +
                '</div>');
                $('body').append(dropdownElm);
            }
            else {
                dropdownElm.addClass('hide');
            }

            var terms = elm.val();


            if (terms.length === 0) {
                dropdownElm.addClass('hide');
                return;
            }

            $.ajax({
                url: defaults.api.replace('%s', encodeURIComponent(elm.val())),
                dataType: 'json',
                success: ajaxCallback,
                error: function() {
                    dropdownElm.addClass('hide');
                }
            });

            /* Calculate and set positions */
            var offset = elm.offset(),
                top = offset.top + elm.outerHeight(),
                left = offset.left;

            width = elm.outerWidth();

            dropdownElm.css({
                left: left + 'px',
                top: top + 'px',
                width: width + 'px'
            });

            /* Handle up down keystrokes */
            dropdownElm.undelegate('a', 'keyup keydown');
            dropdownElm.delegate('a', 'keyup', navigateLink);
            dropdownElm.delegate('a', 'keydown', function(e){
                if (e.which !== 38 && e.which !== 40) return;
                e.preventDefault();
            });


            /* Fire callback, if needed. */
            if (defaults.clickLinkCallback) {
                dropdownElm.undelegate('a', 'click');
                dropdownElm.delegate('a', 'click', function(e) {
                    e.stopPropagation();
                    return defaults.clickLinkCallback(this);
                });
            }
            else {
                dropdownElm.undelegate('a', 'click');
            }
        }


        /* Handles Ajax JSONP results, puts them in dropdown element */
        function ajaxCallback(data) {
            function truncate(original, maxlength) {
                if (original.length <= maxlength) {
                    return original;
                }
                var text = original.substring(0, maxlength + 1);
                text = text.substring(0, text.lastIndexOf(' '));
                var lastChar = text.charAt(text.length - 1);
                if (lastChar == '.' || lastChar == ',' || lastChar == '…') {
                    text = text.substring(0, text.length - 1);
                }
                return text + '…';
            }

            if (data.length == 0) {
                dropdownElm.addClass('hide');
                return;
            }

            dropdownElm.removeClass('hide');

            var html = '<ul>';

            $.each(data, function(index, result) {
                html += '<li><a href="#" data-id="' + result.id + '">' + result.name + '</a></li>';
            });

            html += '</ul>';

            dropdownElm.find('div').html(html);

            dropdownElm.find('a').each(function(index, aElm) {
                aElm = $(aElm);
                aElm.attr('data-index', index);
                highestIndex = index;
            });

            elm[0].focus();
        }


        /* Called when using UP/DOWN keys on links */
        function navigateLink(e) {
            var aElm = $(this),
                upDown = e.which,
                currentIndex = parseInt(aElm.attr('data-index'), 10),
                toShow = null;

            switch (upDown) {
                case 38:
                    toShow = currentIndex - 1;
                    if (toShow < 0) {
                        elm[0].focus();
                        return;
                    }
                    break;
                case 40:
                    toShow = currentIndex + 1;
                    if (toShow > highestIndex) {
                        elm[0].focus();
                        return;
                    }
                    break;
                case 27:
                    dropdownElm.addClass('hide');
                    elm[0].focus();
                    return;
                default:
                    return;
            }

            e.preventDefault();

            selectLink(toShow);
        }


        /* Gives specieif link focus */
        function selectLink(index) {
            var tabbedElm;
            switch(index) {
                case 'first':
                    tabbedElm = dropdownElm.find('a:first');
                    break;
                case 'last':
                    tabbedElm = dropdownElm.find('a:last');
                    break;
                default:
                    tabbedElm = dropdownElm.find('a:eq(' + index + ')')
            }

            tabbedElm[0].focus();
        }


        /* Closes dropdown when clicking outside dropdown or searchbar */
        function documentClick(e) {
            var tgt = $(e.target),
                classNames = '.' + defaults.dropdownClass.replace(/\s/, '.'),
                found = tgt.closest(classNames),
                same = tgt.is(elm);

            if (found.length === 1 || !dropdownElm || same) return;

            dropdownElm.addClass('hide');
        }


        $(window).click(documentClick);


        return elm;
    }
})(jQuery);
