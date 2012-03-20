var Asq = {
    searchTimer: null,
    current: {
        db: 'mysql',
        queryId: null,
        sortColumn: null,
        sortDir: 'asc',
        name: null,
        description: null,
        sql: null,
        offsetRow: 0,
        totalRows: 0,
        requesting: 0
    },



    /* Calls all DOM generating and event binding functions. */
    init: function() {
        Asq.setBoxSections();
        Asq.setListEdit();
        Asq.setEditAjax();
        Asq.setDbDropdown();
        Asq.setSyntaxHighlighting();
        Asq.getDbs();

        $('.search-in-queries').autosuggest({
            api: '/querylist/%s',
            clickLinkCallback: Asq.setDropdownQuery
        });
        $('.search-in-results').bind('keyup change', Asq.searchInResults);

        window.addEventListener('popstate', function(e) {
            Asq.popstate(e);
        });

        $(window).keydown(Asq.checkShortcuts);
        $(window).scroll(Asq.infiniteScroll);

        Asq.recover();
    },



    /* Makes workable object from sections in the HTML, to interact with them. */
    setBoxSections: function() {
        var elms = $('section');

        elms.append('<a href="#" class="close" title="Close">×</a>');

        $('body').on('click', 'a.open', open);
        elms.find('.close').click(close);


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
                        description: Asq.current.description,
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
    },



    /* The list functions, editing, removing of queries et cetera. */
    setListEdit: function() {
        var listElm = $('#list'),
                queryListElm = listElm.find('.query-list'),
                editMode = false,
                html = '<ul class="actions">' +
                            '<li><a href="#" class="icon edit">Edit</a></li>' +
                            '<li><a href="#" class="icon add">Add</a></li>' +
                        '</ul>';

        queryListElm.before(html);

        listElm.find('.edit').click(toggleEdit);
        listElm.find('.add').click(add);

        queryListElm.find('li').each(function(index, elm) {
            elm = $(elm);

            elm.prepend('<a href="#" class="delete hide" title="Delete">&#xF056;</a>');
            elm.append('<a href="#" class="delete-confirm hide">Delete</a>');
        });

        queryListElm.on('click', 'a', aClick);

        queryListElm.find('.delete,.delete-confirm').fadeOut(0);


        function toggleEdit(e) {
            e.preventDefault();

            editMode = !editMode;

            if (editMode) {
                queryListElm.addClass('editable');
                queryListElm.find('.delete').fadeIn(750);
            }
            else {
                queryListElm.removeClass('editable');
                queryListElm.find('.delete,.delete-confirm').fadeOut(750);
            }
        }

        function add(e) {
            e.preventDefault();

            $('section').addClass('hide');
            $('#edit').removeClass('hide');
            Asq.setEditForm(false);
        }

        function aClick(e) {
            e.preventDefault();

            var elm = $(this),
                    id = parseInt(elm.closest('li').find('a:has(strong)').prop('id').substring(6), 10);

            if (editMode && elm.is('.delete')) {
                queryListElm.find('.delete-confirm').fadeOut(750)
                elm.closest('li').find('.delete-confirm').stop().fadeIn(750);
            }
            else if (editMode && elm.is('.delete-confirm')) {
                $('body').addClass('loading');
                $.ajax('/query/' + id, {
                    type: 'DELETE',
                    success: function(data) {
                        $('body').removeClass('loading');
                        if (data.success === false) {
                            Asq.giveMessage('Something went wrong while deleting a query. Please try again.');
                        }
                        else {
                            elm.closest('li').slideUp(500, function() {
                                $(this).remove();
                            });
                            Asq.giveMessage('Query deleted.');
                        }
                    },
                    error: function() {
                        $('body').removeClass('loading');
                        Asq.giveMessage('Something went wrong while deleting a query. Please try again.');
                    }
                });
            }
            else if (editMode) {
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
            else {
                Asq.current.queryId = id;
                Asq.current.sortColumn = null;
                Asq.current.sortDir = 'asc';
                Asq.request();
            }
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
                    description: '',
                    query: ''
                };
                var titleText = 'Add query',
                    submitButtonText = 'Add…';
                idElm.val('false');
            }
            else {
                var titleText = 'Edit query',
                    submitButtonText = 'Edit…';
                idElm.val(options.id);
            }

            elm.find('h1').text(titleText);
            elm.find('#edit-submit').val(submitButtonText);
            elm.find('#edit-name').val(options.name);
            elm.find('#edit-description').val(options.description);
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
                    'edit-description': elm.find('#edit-description').val(),
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
                                        '<a href="#" class="delete hide" title="Delete">&#xF056;</a>' +
                                        '<a href="#" id="query-' + id + '">' +
                                            '<span>' + id + '</span>' +
                                            '<strong>' + data['edit-name'] + '</strong>' +
                                            '<small>' + data['edit-description'] + '</small>' +
                                        '</a>' +
                                        '<a href="#" class="delete-confirm hide">Delete</a>' +
                                    '</li>';

                        $('.query-list ul').append(html);

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



    /* The DB select save function. */
    setDbDropdown: function() {
        var elm = $('#db');

        elm.find('#db-submit').click(selectDb);


        function selectDb() {
            var db = elm.find('#dblist').val();
            Asq.current.db = db;
            Asq.request();
        }
    },



    /* Initiate pretty syntax hightlighting. */
    setSyntaxHighlighting: function() {
        Asq.editor = CodeMirror.fromTextArea(document.getElementById('edit-query'));
    },



    /* Fetch a list of DBs from the HTML and saves it in an array. */
    getDbs: function() {
        var toSet = [];

        $('#dblist option').each(function(index, option) {
            toSet.push($(option).val());
        });

        Asq.dbs = toSet;
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
            }, 'Asq', url);
        }

        Asq.current.offsetRow = 0;
        Asq.current.requesting = 0;

        $('body').addClass('loading');

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
                $('section:not(#db,#list)').addClass('hide');
                $('header .edit.hide').removeClass('hide');
                Asq.displayData(data.results);

                Asq.current.name = data.query.name;
                Asq.current.description = data.query.description;
                Asq.current.sql = data.query.query;
                Asq.current.totalRows = data.query.totalRows;
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

        $('#dblist').val(props.db);

        Asq.request(true);
    },



    /* Displays fetched results in tabular form. */
    displayData: function(results, append) {
        if (!Asq.table) {
            $('body').append('<table><thead><tr></tr></thead><tbody></tbody></table>');
            Asq.table = $('table');
            Asq.table.on('click', 'thead a', Asq.sort);
        }

        if (typeof append == 'undefined') {
            Asq.table.find('thead th,tbody tr').remove();
        }

        var rowHtml;

        $.each(results, function(index, row) {
            rowHtml = $('<tr></tr>');
            $.each(row, function(header, data) {
                if (index == 0 && typeof append == 'undefined') {
                    var aClass = false;

                    if (header == Asq.current.sortColumn) {
                        aClass = 'sort';
                        if (Asq.current.sortDir == 'desc') {
                            aClass += ' sort-desc'
                        }
                    }

                    Asq.table.find('thead tr').append('<th><a href="#" data-column="' + header + '"' + (aClass ? ' class="' + aClass + '"' : '') + '>' + header + '</a></th>');
                }
                rowHtml.append('<td>' + data + '</td>');
            });
            rowHtml.appendTo(Asq.table.find('tbody'));
        });
        
        Asq.zebraStripe();
    },



    /* Sends a request to the server for a sorted column. */
    sort: function(e) {
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

        if (bodyHeight > windowHeight && (bodyHeight - (windowHeight + scrollPosition)) < 250) {
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
                    Asq.inlineFilter();
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



    /* Called when a user clicks on a result in the query autosuggest. */
    setDropdownQuery: function(elm) {
        Asq.current.queryId = parseInt($(elm).attr('data-id'), 10);
        Asq.current.sortColumn = null;
        Asq.current.sortDir = 'asc';
        Asq.request();

        return false;
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
    inlineFilter: function() {
        if (!Asq.table) return;

        var elm = $('.search-in-results'),
            val = elm.val().toLowerCase(),
            valSplit = val.split(' '),
            trElms = Asq.table.find('tbody tr'),
            toShow,
            text;

        trElms.each(function(index, trElm) {
            trElm = $(trElm);

            toShow = false;
            text = trElm.text().toLowerCase();

            if (val.length == 0) {
                toShow = true
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
                trElm.removeClass('hide');
            }
            else {
                trElm.addClass('hide');
            }
        });

        Asq.zebraStripe();
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
    }
}

$(Asq.init);