/**
 * Curstomized autosuggest jQuery Plugin
 */
(function($) {
    var dropdownElm = null;

    $.fn.autosuggest = function(options) {
        var defaults = {},
            elms = this,
            elm = null,
            highestIndex = 0,
            width = 0,
            mostRecent = 0;


        $.extend(defaults, options);


        elms.keyup(typeCheck);
        elms.attr('autocomplete', 'off');
        elms.mouseup(function(e){e.preventDefault()}); // for webkit
        elms.focus(function(e){this.select()});


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
                dropdownElm = $('<div class="suggest-dropdown hide">' +
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

            var dataToSend = {};

            ++mostRecent;

            $.extend(dataToSend, defaults.data, {
                query: elm.val(),
                version: mostRecent
            });

            $('body').addClass('loading');

            $.ajax({
                url: '/autosuggestable',
                dataType: 'json',
                data: dataToSend,
                type: 'POST',
                success: ajaxCallback,
                error: function() {
                    dropdownElm.addClass('hide');
                    $('body').removeClass('loading');
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

            dropdownElm.undelegate('a', 'click');

            /* Fire callback, if needed. */
            if (defaults.clickLinkCallback) {
                dropdownElm.delegate('a', 'click', function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    dropdownElm.addClass('hide');
                    defaults.clickLinkCallback(this);
                    elm[0].focus();
                });
            }
        }


        /* Handles Ajax JSONP results, puts them in dropdown element */
        function ajaxCallback(data) {
            if (mostRecent != data.version) return;

            $('body').removeClass('loading');

            dropdownElm.removeClass('hide');

            var html = '<ul>';

            $.each(data.results, function(index, suggestion) {
                html += '<li><a href="#" data-suggestion="' + suggestion + '">' + suggestion + '</a></li>';
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
                found = tgt.closest('.suggest-dropdown'),
                same = tgt.is(elm);

            if (found.length === 1 || !dropdownElm || same) return;

            dropdownElm.addClass('hide');
        }


        $('body').click(documentClick);


        return elm;
    }
})(jQuery);
