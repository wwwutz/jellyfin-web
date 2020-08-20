import events from 'events';
import layoutManager from 'layoutManager';
import inputManager from 'inputManager';
import * as userSettings from 'userSettings';
import libraryMenu from 'libraryMenu';
import * as mainTabsManager from 'mainTabsManager';
import cardBuilder from 'cardBuilder';
import dom from 'dom';
import imageLoader from 'imageLoader';
import playbackManager from 'playbackManager';
import globalize from 'globalize';
import 'emby-scroller';
import 'emby-itemscontainer';
import 'emby-tabs';
import 'emby-button';

/* eslint-disable indent */

    function enableScrollX() {
        return !layoutManager.desktop;
    }

    function getPortraitShape() {
        return enableScrollX() ? 'overflowPortrait' : 'portrait';
    }

    function getThumbShape() {
        return enableScrollX() ? 'overflowBackdrop' : 'backdrop';
    }

    function loadLatest(page, userId, parentId) {
        const options = {
            IncludeItemTypes: 'Movie',
            Limit: 18,
            Fields: 'PrimaryImageAspectRatio,MediaSourceCount,BasicSyncInfo',
            ParentId: parentId,
            ImageTypeLimit: 1,
            EnableImageTypes: 'Primary,Backdrop,Banner,Thumb',
            EnableTotalRecordCount: false
        };
        ApiClient.getJSON(ApiClient.getUrl('Users/' + userId + '/Items/Latest', options)).then(function (items) {
            const allowBottomPadding = !enableScrollX();
            const container = page.querySelector('#recentlyAddedItems');
            cardBuilder.buildCards(items, {
                itemsContainer: container,
                shape: getPortraitShape(),
                scalable: true,
                overlayPlayButton: true,
                allowBottomPadding: allowBottomPadding,
                showTitle: true,
                showYear: true,
                centerText: true
            });

            // FIXME: Wait for all sections to load
            autoFocus(page);
        });
    }

    function loadResume(page, userId, parentId) {
        let screenWidth = dom.getWindowSize().innerWidth;
        const options = {
            SortBy: 'DatePlayed',
            SortOrder: 'Descending',
            IncludeItemTypes: 'Movie',
            Filters: 'IsResumable',
            Limit: screenWidth >= 1920 ? 5 : screenWidth >= 1600 ? 5 : 3,
            Recursive: true,
            Fields: 'PrimaryImageAspectRatio,MediaSourceCount,BasicSyncInfo',
            CollapseBoxSetItems: false,
            ParentId: parentId,
            ImageTypeLimit: 1,
            EnableImageTypes: 'Primary,Backdrop,Banner,Thumb',
            EnableTotalRecordCount: false
        };
        ApiClient.getItems(userId, options).then(function (result) {
            if (result.Items.length) {
                page.querySelector('#resumableSection').classList.remove('hide');
            } else {
                page.querySelector('#resumableSection').classList.add('hide');
            }

            const allowBottomPadding = !enableScrollX();
            const container = page.querySelector('#resumableItems');
            cardBuilder.buildCards(result.Items, {
                itemsContainer: container,
                preferThumb: true,
                shape: getThumbShape(),
                scalable: true,
                overlayPlayButton: true,
                allowBottomPadding: allowBottomPadding,
                cardLayout: false,
                showTitle: true,
                showYear: true,
                centerText: true
            });

            // FIXME: Wait for all sections to load
            autoFocus(page);
        });
    }

    function getRecommendationHtml(recommendation) {
        let html = '';
        let title = '';

        switch (recommendation.RecommendationType) {
            case 'SimilarToRecentlyPlayed':
                title = globalize.translate('RecommendationBecauseYouWatched', recommendation.BaselineItemName);
                break;

            case 'SimilarToLikedItem':
                title = globalize.translate('RecommendationBecauseYouLike', recommendation.BaselineItemName);
                break;

            case 'HasDirectorFromRecentlyPlayed':
            case 'HasLikedDirector':
                title = globalize.translate('RecommendationDirectedBy', recommendation.BaselineItemName);
                break;

            case 'HasActorFromRecentlyPlayed':
            case 'HasLikedActor':
                title = globalize.translate('RecommendationStarring', recommendation.BaselineItemName);
                break;
        }

        html += '<div class="verticalSection">';
        html += '<h2 class="sectionTitle sectionTitle-cards padded-left">' + title + '</h2>';
        const allowBottomPadding = true;

        if (enableScrollX()) {
            html += '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-mousewheel="false" data-centerfocus="true">';
            html += '<div is="emby-itemscontainer" class="itemsContainer scrollSlider focuscontainer-x">';
        } else {
            html += '<div is="emby-itemscontainer" class="itemsContainer focuscontainer-x padded-left padded-right vertical-wrap">';
        }

        html += cardBuilder.getCardsHtml(recommendation.Items, {
            shape: getPortraitShape(),
            scalable: true,
            overlayPlayButton: true,
            allowBottomPadding: allowBottomPadding,
            showTitle: true,
            showYear: true,
            centerText: true
        });

        if (enableScrollX()) {
            html += '</div>';
        }
        html += '</div>';
        html += '</div>';
        return html;
    }

    function loadSuggestions(page, userId, parentId) {
        let screenWidth = dom.getWindowSize().innerWidth;
        let url = ApiClient.getUrl('Movies/Recommendations', {
            userId: userId,
            categoryLimit: 6,
            ItemLimit: screenWidth >= 1920 ? 8 : screenWidth >= 1600 ? 8 : screenWidth >= 1200 ? 6 : 5,
            Fields: 'PrimaryImageAspectRatio,MediaSourceCount,BasicSyncInfo',
            ImageTypeLimit: 1,
            EnableImageTypes: 'Primary,Backdrop,Banner,Thumb'
        });
        ApiClient.getJSON(url).then(function (recommendations) {
            if (!recommendations.length) {
                page.querySelector('.noItemsMessage').classList.remove('hide');
                page.querySelector('.recommendations').innerHTML = '';
                return;
            }

            const html = recommendations.map(getRecommendationHtml).join('');
            page.querySelector('.noItemsMessage').classList.add('hide');
            let recs = page.querySelector('.recommendations');
            recs.innerHTML = html;
            imageLoader.lazyChildren(recs);

            // FIXME: Wait for all sections to load
            autoFocus(page);
        });
    }

    function autoFocus(page) {
        import('autoFocuser').then(({default: autoFocuser}) => {
            autoFocuser.autoFocus(page);
        });
    }

    function setScrollClasses(elem, scrollX) {
        if (scrollX) {
            elem.classList.add('hiddenScrollX');

            if (layoutManager.tv) {
                elem.classList.add('smoothScrollX');
                elem.classList.add('padded-top-focusscale');
                elem.classList.add('padded-bottom-focusscale');
            }

            elem.classList.add('scrollX');
            elem.classList.remove('vertical-wrap');
        } else {
            elem.classList.remove('hiddenScrollX');
            elem.classList.remove('smoothScrollX');
            elem.classList.remove('scrollX');
            elem.classList.add('vertical-wrap');
        }
    }

    function initSuggestedTab(page, tabContent) {
        const containers = tabContent.querySelectorAll('.itemsContainer');

        for (const container of containers) {
            setScrollClasses(container, enableScrollX());
        }
    }

    function loadSuggestionsTab(view, params, tabContent) {
        const parentId = params.topParentId;
        const userId = ApiClient.getCurrentUserId();
        loadResume(tabContent, userId, parentId);
        loadLatest(tabContent, userId, parentId);
        loadSuggestions(tabContent, userId, parentId);
    }

    function getTabs() {
        return [{
            name: globalize.translate('Movies')
        }, {
            name: globalize.translate('Suggestions')
        }, {
            name: globalize.translate('Trailers')
        }, {
            name: globalize.translate('Favorites')
        }, {
            name: globalize.translate('Collections')
        }, {
            name: globalize.translate('Genres')
        }];
    }

    function getDefaultTabIndex(folderId) {
        switch (userSettings.get('landing-' + folderId)) {
            case 'suggestions':
                return 1;

            case 'favorites':
                return 3;

            case 'collections':
                return 4;

            case 'genres':
                return 5;

            default:
                return 0;
        }
    }

    export default function (view, params) {
        function onBeforeTabChange(e) {
            preLoadTab(view, parseInt(e.detail.selectedTabIndex));
        }

        function onTabChange(e) {
            const newIndex = parseInt(e.detail.selectedTabIndex);
            loadTab(view, newIndex);
        }

        function getTabContainers() {
            return view.querySelectorAll('.pageTabContent');
        }

        function initTabs() {
            mainTabsManager.setTabs(view, currentTabIndex, getTabs, getTabContainers, onBeforeTabChange, onTabChange);
        }

        const getTabController = (page, index, callback) => {
            let depends = '';

            switch (index) {
                case 0:
                    depends = 'controllers/movies/movies';
                    break;

                case 1:
                    depends = 'controllers/movies/moviesrecommended.js';
                    break;

                case 2:
                    depends = 'controllers/movies/movietrailers';
                    break;

                case 3:
                    depends = 'controllers/movies/movies';
                    break;

                case 4:
                    depends = 'controllers/movies/moviecollections';
                    break;

                case 5:
                    depends = 'controllers/movies/moviegenres';
                    break;
            }

            import(depends).then(({default: controllerFactory}) => {
                let tabContent;

                if (index === suggestionsTabIndex) {
                    tabContent = view.querySelector(".pageTabContent[data-index='" + index + "']");
                    this.tabContent = tabContent;
                }

                let controller = tabControllers[index];

                if (!controller) {
                    tabContent = view.querySelector(".pageTabContent[data-index='" + index + "']");

                    if (index === suggestionsTabIndex) {
                        controller = this;
                    } else if (index === 6) {
                        controller = new controllerFactory(view, tabContent, {
                            collectionType: 'movies',
                            parentId: params.topParentId
                        });
                    } else if (index == 0 || index == 3) {
                        controller = new controllerFactory(view, params, tabContent, {
                            mode: index ? 'favorites' : 'movies'
                        });
                    } else {
                        controller = new controllerFactory(view, params, tabContent);
                    }

                    tabControllers[index] = controller;

                    if (controller.initTab) {
                        controller.initTab();
                    }
                }

                callback(controller);
            });
        };

        function preLoadTab(page, index) {
            getTabController(page, index, function (controller) {
                if (renderedTabs.indexOf(index) == -1 && controller.preRender) {
                    controller.preRender();
                }
            });
        }

        function loadTab(page, index) {
            currentTabIndex = index;
            getTabController(page, index, ((controller) => {
                if (renderedTabs.indexOf(index) == -1) {
                    renderedTabs.push(index);
                    controller.renderTab();
                }
            }));
        }

        function onPlaybackStop(e, state) {
            if (state.NowPlayingItem && state.NowPlayingItem.MediaType == 'Video') {
                renderedTabs = [];
                mainTabsManager.getTabsElement().triggerTabChange();
            }
        }

        function onInputCommand(e) {
            switch (e.detail.command) {
                case 'search':
                    e.preventDefault();
                    Dashboard.navigate('search.html?collectionType=movies&parentId=' + params.topParentId);
            }
        }

        let currentTabIndex = parseInt(params.tab || getDefaultTabIndex(params.topParentId));
        const suggestionsTabIndex = 1;

        this.initTab = function () {
            let tabContent = view.querySelector(".pageTabContent[data-index='" + suggestionsTabIndex + "']");
            initSuggestedTab(view, tabContent);
        };

        this.renderTab = function () {
            let tabContent = view.querySelector(".pageTabContent[data-index='" + suggestionsTabIndex + "']");
            loadSuggestionsTab(view, params, tabContent);
        };

        let tabControllers = [];
        let renderedTabs = [];
        view.addEventListener('viewshow', function (e) {
            initTabs();
            if (!view.getAttribute('data-title')) {
                var parentId = params.topParentId;

                if (parentId) {
                    ApiClient.getItem(ApiClient.getCurrentUserId(), parentId).then(function (item) {
                        view.setAttribute('data-title', item.Name);
                        libraryMenu.setTitle(item.Name);
                    });
                } else {
                    view.setAttribute('data-title', globalize.translate('Movies'));
                    libraryMenu.setTitle(globalize.translate('Movies'));
                }
            }

            events.on(playbackManager, 'playbackstop', onPlaybackStop);
            inputManager.on(window, onInputCommand);
        });
        view.addEventListener('viewbeforehide', function () {
            inputManager.off(window, onInputCommand);
        });
        for (const tabController of tabControllers) {
            if (tabController.destroy) {
                tabController.destroy();
            }
        }
    }

/* eslint-enable indent */
