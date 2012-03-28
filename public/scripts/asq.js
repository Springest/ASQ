var Asq = {
    searchTimer: null,
    current: {
        db: 'mysql',
        queryId: null,
        sortColumn: null,
        sortDir: 'asc',
        name: null,
        sql: null,
        offsetRow: 0,
        totalRows: 0,
        requesting: 0
    },
    resize: {
        elm: null,
        resizing: false,
        mousePositionOnStart: 0,
        tableWidthOnStart: 0,
        cellWidthOnStart: 0
    },



    /* Calls all DOM generating and event binding functions. */
    init: function() {
        Asq.setBoxSections();
        Asq.setDbList();
        Asq.setQueryList();
        Asq.setEditAjax();
        Asq.setExport();
        Asq.setSyntaxHighlighting();

        $('.search-in-queries');
        $('.search-in-results').bind('keyup change click', Asq.searchInResults);

        window.addEventListener('popstate', function(e) {
            Asq.popstate(e);
        });

        $(window).keydown(Asq.checkShortcuts);
        $(window).scroll(Asq.infiniteScroll);
        $(window).scroll(Asq.setHeaders);

        Asq.recover();
    },



    /* Makes workable object from sections in the HTML, to interact with them. */
    setBoxSections: function() {
        var elms = $('section');

        elms.append('<a href="#" class="close" title="Close">×</a>');

        $('body').on('click', 'a.open', open);
        elms.find('.close').click(close);

        $('.delete-query').click(deleteQuery);

        function open(e) {
            e.preventDefault();

            var elm = $(this),
                    toOpen = elm.attr('data-ref');

            $('section').addClass('hide');

            $('#' + toOpen).removeClass('hide');

            if (toOpen == 'edit') {
                if (elm.is('.edit')) {
                    Asq.setEditForm({
                        id: Asq.current.queryId,
                        name: Asq.current.name,
                        query: Asq.current.sql
                    });
                }
                else {
                    Asq.setEditForm(false);
                }
            }
        }

        function close(e) {
            e.preventDefault();
            $(this).closest('section').addClass('hide');
        }

        function deleteQuery(e) {
            e.preventDefault();

            var yayOrNay = confirm('Are you sure you want to delete this query?');

            if (!yayOrNay) return;

            var id = parseInt($('#edit-id').val(), 10);

            $('body').addClass('loading');
            $.ajax('/query/' + id, {
                type: 'DELETE',
                success: function(data) {
                    $('body').removeClass('loading');
                    if (data.success === false) {
                        Asq.giveMessage('Something went wrong while deleting a query. Please try again.');
                    }
                    else {
                        $('.query-list a[data-id="' + id + '"]').parent().remove();
                        Asq.giveMessage('Query deleted.');
                    }
                },
                error: function() {
                    $('body').removeClass('loading');
                    Asq.giveMessage('Something went wrong while deleting a query. Please try again.');
                }
            });
        }
    },



    setDbList: function() {
        getDbs();

        var dbsElm = $('.db');

        dbsElm.find('> a').click(function(e){e.preventDefault()});

        dbsElm.find('ul').on('click', 'a', setDbAndFetch);

        function setDbAndFetch(e) {
            if (e.metaKey) return;

            e.preventDefault();

            dbsElm.find('.current').removeClass('current');

            Asq.current.db = $(this).addClass('current').attr('data-db-name');
            Asq.current.sortColumn = null;
            Asq.current.sortDir = 'asc';


            Asq.request();
        }

        function getDbs() {
            var toSet = [];

            $('.db ul a').each(function(index, db) {
                toSet.push($(db).attr('data-db-name'));
            });

            Asq.dbs = toSet;
        }
    },



    /* Makes query list visible on focus, and searchable on type. */
    setQueryList: function() {
        var inputElm = $('.search-in-queries'),
            listElm = $('.query-list');

        inputElm.focus(showQueryList).blur(hideQueryList).keydown(keynavigate);
        inputElm.bind('change keyup click', inlineSearch);
        $(window).click(hideQueryList);

        listElm.find('li').each(function(index, elm) {
            elm = $(elm);

            elm.append('<a href="#" class="edit" title="Edit" data-id="' + elm.find('a').attr('data-id') + '">&#xF040;</a>');
        });

        listElm.on('click', 'a:not(.edit)', setIdAndFetch);
        listElm.on('click', '.edit', openEdit);
        listElm.on('keydown', 'a', keynavigate);

        function showQueryList() {
            listElm.removeClass('hide');
        }

        function hideQueryList(e) {
            if (e) {
                var elm = $(e.target);

                if (elm.closest('.queries').length) return;
            }

            listElm.addClass('hide');
        }

        function keynavigate(e) {
            var elm = $(this),
                which = e.which,
                toFocus;

            switch (which) {
                case 40:
                    if (elm.is('a')) {
                        toFocus = elm.parent().nextAll('li:not(.hide)').find('a:first');

                        if (!toFocus.length) {
                            toFocus = inputElm;
                        }
                    }
                    else {
                        toFocus = listElm.find('a:first');
                    }
                    break;

                case 38:
                    if (elm.is('a')) {
                        toFocus = elm.parent().prevAll('li:not(.hide)').find('a:first');

                        if (!toFocus.length) {
                            toFocus = inputElm;
                        }
                    }
                    else {
                        toFocus = listElm.find('li:last a:first');
                    }
                    break;

                case 37:
                case 39:
                    if (elm.is('a')) {
                        if (elm.is('.edit')) {
                            toFocus = elm.parent().find('a:first');
                        }
                        else {
                            toFocus = elm.parent().find('a:last');
                        }
                    }
                    break;
            }

            if (toFocus && toFocus.length) {
                e.preventDefault();
                toFocus[0].focus();
            }
        }

        function setIdAndFetch(e) {
            if (e.metaKey) return;

            e.preventDefault();
            
            hideQueryList();

            listElm.find('.current').removeClass('current');

            Asq.current.queryId = parseInt($(this).addClass('current').attr('data-id'), 10);
            Asq.current.sortColumn = null;
            Asq.current.sortDir = 'asc';
            Asq.request();
        }

        function openEdit(e) {
            e.preventDefault();

            var id = parseInt($(this).attr('data-id'), 10);

            hideQueryList();

            $('body').addClass('loading');
            $.ajax('/query/' + id, {
                type: 'GET',
                dataType: 'json',
                success: function(data) {
                    $('body').removeClass('loading');
                    Asq.setEditForm(data);
                },
                error: function() {
                    $('body').removeClass('loading');
                    Asq.giveMessage('Something went wrong while fetch info of the requested query. Please try again.');
                }
            });
        }

        function inlineSearch() {
            var val = inputElm.val().toLowerCase(),
                valSplit = val.split(' '),
                toShow,
                text;

            listElm.find('li').each(function(index, liElm) {
                liElm = $(liElm);

                toShow = false;
                text = liElm.text().toLowerCase();

                if (val.length == 0) {
                    toShow = true;
                }
                else {
                    toShow = true
                    for (var i = valSplit.length - 1; i > -1 && toShow; --i) {
                        toShow = false;
                        if (text.indexOf(valSplit[i]) != -1) {
                            toShow = true;
                        }
                    }
                }

                if (toShow) {
                    liElm.removeClass('hide');
                }
                else {
                    liElm.addClass('hide');
                }
            });
        }
    },



    /* Called when user wants to add or edit a query. Sets fields and syntax highlighting. */
    setEditForm: function(options) {
        var elm = $('#edit');

        if (typeof options != 'undefined') {
            var idElm = elm.find('#edit-id');

            if (options === false) {
                options = {
                    name: '',
                    query: ''
                };
                var titleText = 'Add query';
                idElm.val('false');
                elm.find('.delete-query').addClass('hide');
            }
            else {
                var titleText = 'Edit query';
                idElm.val(options.id);
                elm.find('.delete-query').removeClass('hide');
            }

            elm.find('h1').text(titleText);
            elm.find('#edit-name').val(options.name);
            elm.find('#edit-query').val(options.query);

            if (elm.is('.hide')) {
                $('section').addClass('hide');
                elm.removeClass('hide');
            }

            if (Asq.editor) {
                Asq.editor.setValue(options.query);
            }
        }
    },



    /* The query saving functions, calls the server via Ajax. */
    setEditAjax: function() {
        var elm = $('#edit');

        elm.find('form').submit(postAjax);


        function postAjax(e) {
            e.preventDefault();

            var data = {
                    'edit-name': elm.find('#edit-name').val(),
                    'edit-query': Asq.editor.getValue(),
                    'ajax': true
                },
                idElm = elm.find('#edit-id'),
                id = idElm.val(),
                editing = false;

            if (id != 'false') {
                data['edit-id'] = id;
                editing = true;
            }

            $('body').addClass('loading');

            $.ajax('/add', {
                type: 'POST',
                data: data,
                dataType: 'json',
                success: function(response) {
                    $('body').removeClass('loading');

                    var id = response.success;

                    if (!id) {
                        Asq.giveMessage(editing ? 'Something went wrong editing the query. Please try again.': 'Something went wrong adding the query. Please try again.');
                    }
                    else {
                        Asq.giveMessage(editing ? 'Query edited!' : 'Query added!');

                        Asq.current.queryId = id;
                        Asq.current.sortColumn = null;
                        Asq.current.sortDir = 'asc';

                        var html = '<li>' +
                                        '<a href="#" data-id="' + id + '">' +
                                            '<span>' + id + '</span>' +
                                            '<strong>' + data['edit-name'] + '</strong>' +
                                        '</a>' +
                                        '<a href="#" class="edit" title="Edit" data-id="' + elm.find('a').attr('data-id') + '">&#xF040;</a>' +
                                    '</li>';

                        $('.queries ul').append(html);

                        Asq.request();
                    }
                },
                error: function() {
                    $('body').removeClass('loading');
                    Asq.giveMessage(editing ? 'Something went wrong editing the query. Please try again.': 'Something went wrong adding the query. Please try again.');
                }
            });
        }
    },



    setExport: function() {
        var elm = $('#export');

        elm.find('.csv').click(downloadCsv);

        function downloadCsv(e) {
            e.preventDefault();

            var url = '/export/csv/' + Asq.current.db + '/' + Asq.current.queryId;

            if (Asq.current.sortColumn) {
                url += '/' + Asq.current.sortColumn;

                if (Asq.current.sortDir == 'desc') {
                    url += '/desc';
                }
            }

            window.location.href = url;
        }
    },



    /* Initiate pretty syntax hightlighting. */
    setSyntaxHighlighting: function() {
        Asq.editor = CodeMirror.fromTextArea(document.getElementById('edit-query'));
    },



    /* Sends request of a query and calls a function to display the results. Also: set state in history. */
    request: function(push) {
        var url = '/' + Asq.current.db + '/' + Asq.current.queryId;

        if (Asq.current.sortColumn) {
            url += '/' + Asq.current.sortColumn;

            if (Asq.current.sortDir == 'desc') {
                url += '/desc';
            }
        }

        if (typeof push == 'undefined') {
            history.pushState({
                id: Asq.current.queryId,
                db: Asq.current.db,
                sortColumn: Asq.current.sortColumn,
                sortDir: Asq.current.sortDir
            }, 'ASQ', url);
        }

        Asq.current.offsetRow = 0;
        Asq.current.requesting = 0;

        $('body').addClass('loading');
        $('section').addClass('hide');

        $.ajax('/results', {
            dataType: 'json',
            type: 'post',
            data: {
                id: Asq.current.queryId,
                db: Asq.current.db,
                sortColumn: Asq.current.sortColumn,
                sortDir: Asq.current.sortDir,
                offset: 0
            },
            success: function(data) {
                $('body').removeClass('loading');
                $('header .edit.hide,header .export.hide').removeClass('hide');

                Asq.current.totalRows = data.query.totalRows;

                Asq.displayData(data.results);

                Asq.current.name = data.query.name;
                Asq.current.sql = data.query.query;

                Asq.setLinks();

                Asq.inlineFilter(true);
            },
            error: function(data) {
                $('body').removeClass('loading');
                Asq.giveMessage('Something went wrong fetching that query. Please try again.');
            }
        });
    },



    /* Grabs */
    recover: function() {
        var parts = location.href.split('/');

        if (parts.length <= 4) return;

        if (parts[3] != '' && Asq.dbs.indexOf(parts[3]) != -1) {
            Asq.current.db = parts[3];

            var dbElm = $('.db');
            dbElm.find('.current').removeClass('current');
            dbElm.find('a[data-db-name="' + parts[3] + '"]').addClass('current');
        }

        var queryId = parseInt('0' + parts[4], 10);

        if (queryId !== 0) {
            Asq.current.queryId = queryId;
        }

        Asq.current.sortColumn = (typeof parts[5] != 'undefined') ? parts[5] : null;
        Asq.current.sortDir = (parts[6] == 'desc') ? 'desc' : 'asc';

        $('#dblist').val(Asq.current.db);

        Asq.request(true);
    },



    /* Pops a state from the browser history. */
    popstate: function(e) {
        var props = e.state;

        if (!props) return;

        Asq.current.queryId = props.id;
        Asq.current.db = props.db;
        Asq.current.sortColumn = props.sortColumn;
        Asq.current.sortDir = props.sortDir;

        var dbElm = $('.db');
        dbElm.find('.current').removeClass('current');
        dbElm.find('a[data-db-name="' + Asq.current.db + '"]').addClass('current');

        Asq.request(true);
    },



    setLinks: function() {
        $('.db ul a').each(function(index, elm) {
            elm = $(elm);
            elm.attr('href', '/' + elm.attr('data-db-name') + '/' + Asq.current.queryId);
        });

        $('.query-list a').each(function(index, elm) {
            elm = $(elm);
            elm.attr('href', '/' + Asq.current.db + '/' + elm.attr('data-id'));
        });

        Asq.tableHead.find('a').each(function(index, elm) {
            elm = $(elm);

            var column = elm.attr('data-column');

            if (column === Asq.current.sortColumn) {
                column += '/desc';
            }

            elm.attr('href', '/' + Asq.current.db + '/' + Asq.current.queryId + '/' + column);
        });
    },



    /* Displays fetched results in tabular form. */
    displayData: function(results, append) {
        if (!Asq.table) {
            $('body').append('<table class="table-head"><tr></tr></table><table class="table-body"><tbody></tbody></table><p class="meta-results"></p>');
            Asq.tableHead = $('table.table-head');
            Asq.table = $('table.table-body');
            Asq.tableHead.on('click', 'a', Asq.sort);
            Asq.tableHead.on('mousedown', 'th', Asq.startResizeColumn);
            $('body').mousemove(Asq.dragRezizeColumn).mouseup(Asq.endResizeColumn);
        }

        if (typeof append == 'undefined') {
            Asq.table.css('width', 'auto');
            Asq.tableHead.css('width', 'auto');
            Asq.tableHead.find('th').remove();
            Asq.table.find('tr').remove();
        }

        var rowHtml,
            count = 0;

        $.each(results, function(index, row) {
            rowHtml = $('<tr></tr>');
            count = 0;
            $.each(row, function(header, data) {
                if (index == 0 && typeof append == 'undefined') {
                    var aClass = false;

                    if (header == Asq.current.sortColumn) {
                        aClass = 'sort';
                        if (Asq.current.sortDir == 'desc') {
                            aClass += ' sort-desc'
                        }
                    }

                    Asq.tableHead.find('tr').append('<th data-offset="' + count + '"><a href="#" data-column="' + header + '"' + (aClass ? ' class="' + aClass + '"' : '') + '>' + header + '</a></th>');
                }
                rowHtml.append('<td>' + data + '</td>');
                ++count;
            });
            rowHtml.appendTo(Asq.table.find('tbody'));
        });

        var currentAmount = Math.min((Asq.current.offsetRow + 1) * 100, Asq.current.totalRows);

        $('.meta-results').html('Displaying ' + currentAmount + ' out of a total of ' + Asq.current.totalRows + ' results.');
        
        Asq.setHeaders();
        Asq.zebraStripe();
    },



    /* Sends a request to the server for a sorted column. */
    sort: function(e) {
        if (e.metaKey) return;

        e.preventDefault();

        var newColumn = $(this).attr('data-column');

        if (Asq.current.sortColumn == newColumn) {
            Asq.current.sortDir = Asq.current.sortDir == 'desc' ? 'asc' : 'desc';
        }
        else {
            Asq.current.sortColumn = newColumn;
            Asq.current.sortDir = 'asc';
        }

        Asq.request();
    },



    /* Does a request to the server when the user almost hits the bottom of the web page. */
    infiniteScroll: function(e) {
        var windowHeight = $(window).height(),
            bodyHeight = $('body').outerHeight(),
            scrollPosition = $('body').scrollTop();

        if ((((bodyHeight > windowHeight && (bodyHeight - (windowHeight + scrollPosition)) < 250) || typeof e == 'boolean') && ((Asq.current.offsetRow + 1) * 100) < Asq.current.totalRows)) {
            if (Asq.current.requesting > Asq.current.offsetRow) return;

            Asq.current.requesting = Asq.current.offsetRow + 1;

            $('body').addClass('loading');

            $.ajax('/results', {
                dataType: 'json',
                type: 'post',
                data: {
                    id: Asq.current.queryId,
                    db: Asq.current.db,
                    sortColumn: Asq.current.sortColumn,
                    sortDir: Asq.current.sortDir,
                    offset: Asq.current.requesting
                },
                success: function(data) {
                    $('body').removeClass('loading');
                    Asq.current.offsetRow = Asq.current.requesting;
                    Asq.displayData(data.results, true);
                    Asq.inlineFilter(true);

                    if (typeof e == 'boolean' && bodyHeight < windowHeight && ((Asq.current.offsetRow + 1) * 100) < Asq.current.totalRows) {
                        Asq.infiniteScroll(true);
                    }
                },
                error: function(data) {
                    $('body').removeClass('loading');
                    Asq.giveMessage('Something went wrong fetching that query. Please try again.');
                    Asq.current.requesting = Asq.current.offsetRow;
                }
            });
        }
    },



    /* Displays a simple warning / success message to the user. */
    giveMessage: function(text) {
        if (!Asq.messageDialog) {
            Asq.messageDialog = $('<div class="message-dialog hide"></div>');
            Asq.messageDialog.appendTo('body');
        }

        Asq.messageDialog.text(text).removeClass('hide').stop().fadeIn(0);
        setTimeout(function() {
            Asq.messageDialog.fadeOut(500, function() {
                Asq.messageDialog.addClass('hide');
            })
        }, 2000);
    },



    /* Called when a user types in the inline search bar, to filter results from the table. */
    searchInResults: function() {
        if (Asq.searchTimer) {
            clearTimeout(Asq.searchTimer);
            Asq.searchTimer = null;
        }

        Asq.searchTimer = setTimeout(Asq.inlineFilter, 250);
    },



    /* Loops over the table and hides not wanted results from it. */
    inlineFilter: function(noInfinite) {
        if (!Asq.table) return;

        var elm = $('.search-in-results'),
            val = elm.val().toLowerCase(),
            valSplit = val.split(' '),
            trElms = Asq.table.find('tbody tr'),
            toShow,
            text,
            totalShown = 0;

        trElms.each(function(index, trElm) {
            trElm = $(trElm);

            toShow = false;
            text = trElm.text().toLowerCase();

            if (val.length == 0) {
                toShow = true;
            }
            else {
                toShow = true
                for (var i = valSplit.length - 1; i > -1 && toShow; --i) {
                    toShow = false;
                    if (text.indexOf(valSplit[i]) != -1) {
                        toShow = true;
                    }
                }
            }

            if (toShow) {
                ++totalShown;
                trElm.removeClass('hide');
            }
            else {
                trElm.addClass('hide');
            }
        });

        Asq.zebraStripe();

        if (typeof noInfinite == 'undefined' && val.length > 0) {
            Asq.infiniteScroll(true);
        }

        var currentAmount = Math.min(totalShown, (Asq.current.offsetRow + 1) * 100, Asq.current.totalRows);

        $('.meta-results').html('Displaying ' + currentAmount + ' out of a total of ' + Asq.current.totalRows + ' results.');

        Asq.setHeaders();
    },



    /* Sets the width of the table header for fixed positioning */
    setHeaders: function() {
        var headers = Asq.tableHead.find('th'),
            firstRow = Asq.table.find('tr:not(.hide):first td');

        Asq.tableHead.css({
            left: '-' + $('body').scrollLeft() + 'px',
            width: Asq.table.outerWidth() + 'px'
        });

        headers.each(function(index, elm) {
            elm = $(elm);
            elm.css('width', firstRow.eq(index).outerWidth() + 'px');
        });
    },



    /* Clicking on a table header calls this function, that sets metadata about the event in a global var. */
    startResizeColumn: function(e) {
        var elm = $(this),
            rightSideOffset = elm.offset().left + elm.outerWidth();

        if (e.pageX < rightSideOffset && (rightSideOffset - e.pageX) < 12) {
            Asq.resize.resizing = true;
            Asq.resize.elm = elm;
            Asq.resize.mousePositionOnStart = e.pageX;
            Asq.resize.tableWidthOnStart = Asq.tableHead.outerWidth();
            Asq.resize.cellWidthOnStart = elm.outerWidth();
            $('body').addClass('resizing');
        }
    },



    /* Resizes a column when the drag is initiated an the cursor is move. */
    dragRezizeColumn: function(e) {
        if (!Asq.resize.resizing) return;

        var mousePositionNow = e.pageX,
            diff = mousePositionNow - Asq.resize.mousePositionOnStart,
            elmOffset = parseInt(Asq.resize.elm.attr('data-offset'), 10);

        Asq.resize.elm.css('width', Asq.resize.cellWidthOnStart + diff + 'px');

        Asq.table.find('tr:not(.hide):first td:eq(' + elmOffset + ')').css('width', Asq.resize.cellWidthOnStart + diff + 'px');
        Asq.tableHead.css('width', Asq.resize.tableWidthOnStart + diff + 'px');
        Asq.table.css('width', Asq.resize.tableWidthOnStart + diff + 'px');
    },



    /* Unsets drag and fits all columns appropriately */
    endResizeColumn: function() {
        Asq.resize.resizing = false;
        $('body').removeClass('resizing');
        Asq.setHeaders();
    },



    /* Zebrastripes the table. */
    zebraStripe: function() {
        if (!Asq.table) return;

        var even = false;

        Asq.table.find('tbody tr').each(function(index, elm) {
            elm = $(elm);

            if (elm.is('.hide')) return;

            if (even) {
                elm.addClass('even');
            }
            else {
                elm.removeClass('even');   
            }

            even = !even;
        });
    },



    /* Esc to close dialogs, slash to focus autosuggest. */
    checkShortcuts: function(e) {
        if (e.which == 27) {
            e.preventDefault();
            $('section').addClass('hide');
        }
        else if (e.which == 191 || e.which == 47) {
            if (!$(e.target).is('textarea,select,input,option,submit,button')) {
                e.preventDefault();
                $('.search-in-queries').val('')[0].focus();
            }
        }
        else if (e.which == 70 && e.metaKey) {
            if (!$(e.target).is('textarea,select,input,option,submit,button')) {
                e.preventDefault();
                $('.search-in-results').val('')[0].focus();
            }
        }
    }
}

$(Asq.init);