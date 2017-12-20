(function() {
    var InfiniSelect = function(element, options) {
        // create new infiniselect object
        var infiniselect = {};
        
        // initialise object
        InfiniSelect.init(infiniselect, element, options);
        
        // return new infiniselect
        return infiniselect;
    };
    
    InfiniSelect.init = function(infiniselect, element, options) {
        
        // setup options
        infiniselect.options = options;
        infiniselect.isOpened = false;
        // setup functions
        infiniselect.open = function() {
            infiniselect.elements.search.focus();
            infiniselect.elements.wrapper.classList.add('infiniselect-wrapper-open');
            infiniselect.elements.dropdownWrapper.classList.add('infiniselect-dropdown-open');
            
            // set wrapper position
            var bounding = infiniselect.elements.main.getBoundingClientRect();
            //console.log(infiniselect.elements.dropdownWrapper.style);
            infiniselect.elements.dropdownWrapper.style.left = bounding.left + (window.scrollX || document.documentElement.scrollLeft) + 'px';
            infiniselect.elements.dropdownWrapper.style.top = bounding.bottom + (window.scrollY || document.documentElement.scrollTop) + 'px';
            infiniselect.elements.dropdownWrapper.style.width = bounding.width + 'px';
            infiniselect.isOpened = true;
        };
        
        infiniselect.close = function() {
            infiniselect.elements.search.blur();
            infiniselect.elements.wrapper.classList.remove('infiniselect-wrapper-open');
            infiniselect.elements.dropdownWrapper.classList.remove('infiniselect-dropdown-open');
            infiniselect.isOpened = false;
        };
        
        // setup elements
        InfiniSelect.createElements(infiniselect, element);
        InfiniSelect.addEvents(infiniselect);
        
        // load first page
        InfiniSelect.loadNextPage(infiniselect);
    };
    
    InfiniSelect.createElements = function(infiniselect, element) {
        infiniselect.elements = {
            main: element
        };

        var placeHolder = infiniselect.options.defaultSelection == 'all' ? '(All)' : '0 items selected';

        infiniselect.elements.main.innerHTML = '<div class="infiniselect-wrapper"><input type="text" class="infiniselect-search" placeholder="'+ placeHolder +'" /></div>';
        infiniselect.elements.wrapper = infiniselect.elements.main.querySelector('.infiniselect-wrapper');
        infiniselect.elements.search = infiniselect.elements.main.querySelector('.infiniselect-search');
        
        var dropdown = document.createElement('div');
        dropdown.classList = 'infiniselect-dropdown-wrapper';
        dropdown.innerHTML = '<div class="infiniselect-dropdown-actions"><button class="infiniselect-dropdown-action infiniselect-dropdown-show-selected">Show selected only</button><button class="infiniselect-dropdown-action infiniselect-dropdown-select-all">Select all</button><button class="infiniselect-dropdown-action infiniselect-dropdown-select-none">Select none</button></div><div class="infiniselect-dropdown-scroll clusterize-scroll"><div class="infiniselect-dropdown-content clusterize-content"><div class="infiniselect-dropdown-row infiniselect-dropdown-no-select clusterize-no-data">Loading items...</div></div></div>';
        document.body.appendChild(dropdown);
        
        infiniselect.elements.dropdownWrapper = dropdown;
        infiniselect.elements.dropdownScroll = dropdown.querySelector('.infiniselect-dropdown-scroll');
        infiniselect.elements.dropdownContent = dropdown.querySelector('.infiniselect-dropdown-content');
        infiniselect.elements.dropdownActions = dropdown.querySelector('.infiniselect-dropdown-actions');
        infiniselect.elements.dropdownShowSelected = dropdown.querySelector('.infiniselect-dropdown-show-selected');
        infiniselect.elements.dropdownSelectNone = dropdown.querySelector('.infiniselect-dropdown-select-none');
        infiniselect.elements.dropdownSelectAll = dropdown.querySelector('.infiniselect-dropdown-select-all');
    };
    
    InfiniSelect.addEvents = function(infiniselect) {
        infiniselect.elements.dropdownShowSelected.addEventListener('click', function(event) {
            if (!infiniselect.isLoading) {
                InfiniSelect.showSelectedOnly(infiniselect);
            }
        });
        
        infiniselect.elements.dropdownSelectNone.addEventListener('click', function(event) {
            if (!infiniselect.isLoading) {
                infiniselect.elements.dropdownSelectNone.setAttribute('disabled', 'disabled');
                infiniselect.elements.dropdownSelectAll.removeAttribute('disabled');
                InfiniSelect.selectAll(infiniselect, false);
            }
        });
        
        infiniselect.elements.dropdownSelectAll.addEventListener('click', function(event) {
            if (!infiniselect.isLoading) {
                infiniselect.elements.dropdownSelectAll.setAttribute('disabled', 'disabled');
                infiniselect.elements.dropdownSelectNone.removeAttribute('disabled');
                InfiniSelect.selectAll(infiniselect, true);
            }
        });
        
        window.addEventListener('mousedown', function(event) {
            // is the clicked element inside the infiniselect elements
            var isInInfiniSelect = false;
            var isInputWrapper = ((event.target === infiniselect.elements.search) || (event.target === infiniselect.elements.wrapper));
            for (element in infiniselect.elements) {
                if (infiniselect.elements[element] === event.target || infiniselect.elements[element] === event.target.parentNode) {
                    isInInfiniSelect = true;
                    break;
                }
            }
            
            infiniselect.mouse_moved = false;
            
            if (isInInfiniSelect) {
                if((isInputWrapper && !infiniselect.isOpened) || !isInputWrapper) {
                    infiniselect.open();
                    infiniselect.is_selecting = InfiniSelect.isSelectableRow(event.target);
                    infiniselect.is_selecting_element = null;
                } else {
                    infiniselect.close();
                }
            } else {
                infiniselect.close();
            }
        });
        
        infiniselect.elements.dropdownContent.addEventListener('mousemove', function(event) {
            if (infiniselect.is_selecting && infiniselect.is_selecting_element !== event.target.dataset.index && InfiniSelect.isSelectableRow(event.target)) {
                infiniselect.mouse_moved = true;
                
                //InfiniSelect.toggleSelection(infiniselect, event.target.dataset.index);
                InfiniSelect.toggleSelectionByContent(infiniselect, event.target.dataset.content);
                infiniselect.is_selecting_element = event.target.dataset.index;
            }
        });
        
        window.addEventListener('mouseup', function(event) {
            // if just clicked one element
            if (infiniselect.is_selecting && !infiniselect.mouse_moved) {
               // InfiniSelect.toggleSelection(infiniselect, event.target.dataset.index);
               InfiniSelect.toggleSelectionByContent(infiniselect, event.target.dataset.content);
            }
            
            infiniselect.is_selecting = false;
        });
        
        infiniselect.elements.search.addEventListener('input', function(event) {
            infiniselect.searchValue = this.value;

            if (infiniselect.searchTimer) {
                clearTimeout(infiniselect.searchTimer);
            }
            
            infiniselect.searchTimer = setTimeout(function() {
                infiniselect.isSearching = infiniselect.searchValue !== '';
                
                infiniselect.elements.dropdownSelectAll.innerHTML = infiniselect.isSearching ? 'Select all filtered' : 'Select all';
                
                if (infiniselect.isSearching) {
                    infiniselect.clusterize.update(InfiniSelect.transformData([{content: 'Searching for items...', selectable: false}]));
                    InfiniSelect.loadNextPage(infiniselect, false);
                } else {
                    infiniselect.searchData = [];
                    infiniselect.data = infiniselect.allData;
                    InfiniSelect.updateData(infiniselect);
                }
            }, infiniselect.options.searchTimer || 1500);
        });
    };
    
    InfiniSelect.loadNextPage = function(infiniselect, showLoading) {
        // if already loading don't send request again
        if (infiniselect.isLoading || infiniselect.showSelectedOnly) {
            return false;
        }
        
        var rowCount = 0;
        
        // show loading message
        if (infiniselect.clusterize) {
            if (showLoading !== false) {
                infiniselect.clusterize.append(InfiniSelect.transformData([{content: 'Loading more items...', selectable: false}]));
            }
            rowCount = infiniselect.clusterize.getRowsAmount();
        }
        
        InfiniSelect.setLoading(infiniselect, true);
        
        if (infiniselect.isSearching) {
            infiniselect.options.search.call(infiniselect, infiniselect.searchValue, rowCount, function(response) {
                if (!infiniselect.searchData) {
                    infiniselect.searchData = [];
                }

                infiniselect.searchData = response.data;
                //infiniselect.searchData = infiniselect.searchData.concat(response.data);
                
                infiniselect.data = infiniselect.searchData;
                
                InfiniSelect.updateData(infiniselect);
                
                InfiniSelect.setLoading(infiniselect, false);
            });
        } else {
            // do call to get more data
            infiniselect.options.loadNextPage.call(infiniselect, rowCount, function(response) {
                if (!infiniselect.allData) {
                    infiniselect.allData = [];
                }

                 // The following loops has been disabled to performance issue. Needs to revisited
                 
                /*for(var i = 0; i < response.data.length; i++) {
                    var result = $.grep(infiniselect.allData, function(e) { return e.content == response.data[i].content; });
                    if(result.length > 0) {
                        if(result[0].selected) {
                            response.data[i].selected = result[0].selected;
                        }
                    }
                }*/

                infiniselect.allData = response.data;
                //infiniselect.allData = infiniselect.allData.concat(response.data);
                
                infiniselect.data = infiniselect.allData;
                
                // initialise clusterize if not setup
                if (!infiniselect.clusterize) {
                    var rows = InfiniSelect.transformData(infiniselect.allData);
                    InfiniSelect.initClusterize(infiniselect, rows);
                } else {
                    InfiniSelect.updateData(infiniselect);
                }
                
                InfiniSelect.setLoading(infiniselect, false);
            });
        }
    };
    
    InfiniSelect.transformData = function(data) {
        var rows = [];
        for (var i = 0; i < data.length; i++) {
            var classes = 'infiniselect-dropdown-row';
            
            if (data[i].selected) {
                classes += ' infiniselect-dropdown-row-selected';
            }
            
            rows.push('<div class="' + classes + '" data-index="' + i + '" data-content="' + data[i].content + '">' + data[i].content + '</div>');
        }
        
        return rows;
    };
    
    InfiniSelect.updateData = function(infiniselect) {
        var rows = InfiniSelect.transformData(infiniselect.data);
        infiniselect.clusterize.update(rows);
    };
    
    InfiniSelect.showSelectedOnly = function(infiniselect) {
        infiniselect.selectedData = [];
        
        infiniselect.showSelectedOnly = !infiniselect.showSelectedOnly;
        
        if (infiniselect.showSelectedOnly) {
            for (var i = 0; i < infiniselect.allData.length; i++) {
                if (infiniselect.allData[i].selected) {
                    infiniselect.selectedData.push(infiniselect.allData[i]);
                }
            }
            
            infiniselect.data = infiniselect.selectedData;
            infiniselect.elements.dropdownShowSelected.innerHTML = 'Show all';
        } else {
            infiniselect.data = infiniselect.allData;
            infiniselect.elements.dropdownShowSelected.innerHTML = 'Show selected only';
        }
        
        InfiniSelect.updateData(infiniselect);
    };
    
    InfiniSelect.initClusterize = function(infiniselect, rows) {
        infiniselect.clusterize = new Clusterize({
            rows: rows,
            scrollElem: infiniselect.elements.dropdownScroll,
            contentElem: infiniselect.elements.dropdownContent,
            no_data_class: 'infiniselect-dropdown-row infiniselect-dropdown-no-select',
            callbacks: {
                scrollingProgress: function(progress) {
                    if (infiniselect.elements.dropdownScroll.scrollTop >= infiniselect.elements.dropdownScroll.scrollHeight - infiniselect.elements.dropdownScroll.clientHeight - 200) {
                        InfiniSelect.loadNextPage(infiniselect);
                    }
                }
            }
        });
    };
    
    InfiniSelect.toggleSelection = function(infiniselect, index) {
        infiniselect.allData[index].selected = !infiniselect.allData[index].selected;
        
        if (!infiniselect.selectedCount) {
            infiniselect.selectedCount = 0;
        }
        
        if (infiniselect.allData[index].selected) {
            infiniselect.selectedCount++;
        } else {
            infiniselect.selectedCount--;
        }
        
        InfiniSelect.updateCountSelected(infiniselect, infiniselect.selectedCount);
        
        InfiniSelect.updateData(infiniselect);
    };

    InfiniSelect.toggleSelectionByContent = function(infiniselect, content) {
        for (var i = 0; i < infiniselect.allData.length; i++) {
            if(infiniselect.allData[i].content == content) {
                infiniselect.allData[i].selected = !infiniselect.allData[i].selected;
                if (!infiniselect.selectedCount) {
                    infiniselect.selectedCount = 0;
                }
                
                if (infiniselect.allData[i].selected) {
                    infiniselect.selectedCount++;
                } else {
                    infiniselect.selectedCount--;
                }
            }
        }
        
        InfiniSelect.updateCountSelected(infiniselect, infiniselect.selectedCount);
        
        InfiniSelect.updateData(infiniselect);
    };
    
    InfiniSelect.selectAll = function(infiniselect, toggle) {
        for (var i = 0; i < infiniselect.data.length; i++) {
            infiniselect.data[i].selected = toggle;
        }
        
        InfiniSelect.updateCountSelected(infiniselect, toggle ? infiniselect.data.length : 0);
        InfiniSelect.updateData(infiniselect);
    };
    
    InfiniSelect.updateCountSelected = function(infiniselect, count) {
        infiniselect.selectedCount = count;
        var placeHolder = infiniselect.selectedCount === 1 ? '1 item selected' : infiniselect.selectedCount + ' items selected';
        if(infiniselect.options.defaultSelection == 'all' && (infiniselect.selectedCount == 0 || infiniselect.selectedCount == infiniselect.allData.length)) {
            placeHolder = '(All)';
        }
        
        infiniselect.elements.search.setAttribute('placeholder', placeHolder);        
    };
    
    InfiniSelect.isSelectableRow = function(element) {
        return element.classList.contains('infiniselect-dropdown-row') && !element.classList.contains('infiniselect-dropdown-no-select');
    };
    
    InfiniSelect.setLoading = function(infiniselect, status) {
        infiniselect.isLoading = status;
        
        if (status) {
            infiniselect.elements.dropdownShowSelected.setAttribute('disabled', 'disabled');
            infiniselect.elements.dropdownSelectNone.setAttribute('disabled', 'disabled');
            infiniselect.elements.dropdownSelectAll.setAttribute('disabled', 'disabled');
        } else {
            infiniselect.elements.dropdownShowSelected.removeAttribute('disabled');
            infiniselect.elements.dropdownSelectNone.removeAttribute('disabled');
            infiniselect.elements.dropdownSelectAll.removeAttribute('disabled');
        }
    };
    
    window.InfiniSelect = InfiniSelect;
})();