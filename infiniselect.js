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
        
        // setup functions
        infiniselect.open = function() {
            infiniselect.elements.search.focus();
            infiniselect.elements.wrapper.classList.add('infiniselect-wrapper-open');
            infiniselect.elements.dropdownWrapper.classList.add('infiniselect-dropdown-open');
        };
        infiniselect.close = function() {
            infiniselect.elements.search.blur();
            infiniselect.elements.wrapper.classList.remove('infiniselect-wrapper-open');
            infiniselect.elements.dropdownWrapper.classList.remove('infiniselect-dropdown-open');
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
        
        infiniselect.elements.main.innerHTML = '<div class="infiniselect-wrapper"><input type="text" class="infiniselect-search" placeholder="0 items selected" /></div>';
        infiniselect.elements.wrapper = infiniselect.elements.main.querySelector('.infiniselect-wrapper');
        infiniselect.elements.search = infiniselect.elements.main.querySelector('.infiniselect-search');
        
        var dropdown = document.createElement('div');
        dropdown.classList = 'infiniselect-dropdown-wrapper';
        dropdown.innerHTML = '<div class="infiniselect-dropdown-actions"><button class="infiniselect-dropdown-action infiniselect-dropdown-show-selected">Show selected only</button><button class="infiniselect-dropdown-action infiniselect-dropdown-select-none">Select none</button><button class="infiniselect-dropdown-action infiniselect-dropdown-select-all">Select all</button></div><div class="infiniselect-dropdown-scroll clusterize-scroll"><div class="infiniselect-dropdown-content clusterize-content"><div class="infiniselect-dropdown-row clusterize-no-data">Loading items...</div></div></div>';
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
            InfiniSelect.showSelectedOnly(infiniselect);
        });
        
        infiniselect.elements.dropdownSelectNone.addEventListener('click', function(event) {
            InfiniSelect.selectAll(infiniselect, false);
        });
        
        infiniselect.elements.dropdownSelectAll.addEventListener('click', function(event) {
            InfiniSelect.selectAll(infiniselect, true);
        });
        
        window.addEventListener('mousedown', function(event) {
            // is the clicked element inside the infiniselect elements
            var isInInfiniSelect = false;
            for (element in infiniselect.elements) {
                if (infiniselect.elements[element] === event.target || infiniselect.elements[element] === event.target.parentNode) {
                    isInInfiniSelect = true;
                    break;
                }
            }
            
            infiniselect.mouse_moved = false;
            
            if (isInInfiniSelect) {
                infiniselect.open();
                infiniselect.is_selecting = event.target.classList.contains('infiniselect-dropdown-row');
                infiniselect.is_selecting_element = null;
            } else {
                infiniselect.close();
            }
        });
        
        infiniselect.elements.dropdownContent.addEventListener('mousemove', function(event) {
            if (infiniselect.is_selecting && infiniselect.is_selecting_element !== event.target.dataset.index && event.target.classList.contains('infiniselect-dropdown-row')) {
                infiniselect.mouse_moved = true;
                
                InfiniSelect.toggleSelection(infiniselect, event.target.dataset.index);
                infiniselect.is_selecting_element = event.target.dataset.index;
            }
        });
        
        window.addEventListener('mouseup', function(event) {
            // if just clicked one element
            if (infiniselect.is_selecting && !infiniselect.mouse_moved) {
                InfiniSelect.toggleSelection(infiniselect, event.target.dataset.index);
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
                
                if (infiniselect.isSearching) {
                    infiniselect.clusterize.update(InfiniSelect.transformData([{content: 'Searching for items...'}]));
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
                infiniselect.clusterize.append(InfiniSelect.transformData([{content: 'Loading more items...'}]));
            }
            rowCount = infiniselect.clusterize.getRowsAmount();
        }
        
        infiniselect.isLoading = true;
        
        if (infiniselect.isSearching) {
            infiniselect.options.search.call(infiniselect, infiniselect.searchValue, rowCount, function(response) {
                if (!infiniselect.searchData) {
                    infiniselect.searchData = [];
                }
                infiniselect.searchData = infiniselect.searchData.concat(response.data);
                
                infiniselect.data = infiniselect.searchData;
                
                InfiniSelect.updateData(infiniselect);
                
                infiniselect.isLoading = false;
            });
        } else {
            // do call to get more data
            infiniselect.options.loadNextPage.call(infiniselect, rowCount, function(response) {
                if (!infiniselect.allData) {
                    infiniselect.allData = [];
                }
                infiniselect.allData = infiniselect.allData.concat(response.data);
                
                infiniselect.data = infiniselect.allData;
                
                // initialise clusterize if not setup
                if (!infiniselect.clusterize) {
                    var rows = InfiniSelect.transformData(infiniselect.allData);
                    InfiniSelect.initClusterize(infiniselect, rows);
                } else {
                    InfiniSelect.updateData(infiniselect);
                }
                
                infiniselect.isLoading = false;
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
            
            rows.push('<div class="' + classes + '" data-index="' + i + '">' + data[i].content + '</div>');
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
    
    InfiniSelect.selectAll = function(infiniselect, toggle) {
        for (var i = 0; i < infiniselect.data.length; i++) {
            infiniselect.data[i].selected = toggle;
        }
        
        InfiniSelect.updateCountSelected(infiniselect, toggle ? infiniselect.data.length : 0);
        InfiniSelect.updateData(infiniselect);
    };
    
    InfiniSelect.updateCountSelected = function(infiniselect, count) {
        infiniselect.selectedCount = count;
        
        infiniselect.elements.search.setAttribute('placeholder', infiniselect.selectedCount === 1 ? '1 item selected' : infiniselect.selectedCount + ' items selected');
    };
    
    window.InfiniSelect = InfiniSelect;
})();