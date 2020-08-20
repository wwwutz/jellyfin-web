import $ from 'jQuery';
import loading from 'loading';
import libraryMenu from 'libraryMenu';
import globalize from 'globalize';

/* eslint-disable indent */

    function loadPage(page, config) {
        $('#txtMinResumePct', page).val(config.MinResumePct);
        $('#txtMaxResumePct', page).val(config.MaxResumePct);
        $('#txtMinResumeDuration', page).val(config.MinResumeDurationSeconds);
        loading.hide();
    }

    function onSubmit() {
        loading.show();
        const form = this;
        ApiClient.getServerConfiguration().then(function (config) {
            config.MinResumePct = $('#txtMinResumePct', form).val();
            config.MaxResumePct = $('#txtMaxResumePct', form).val();
            config.MinResumeDurationSeconds = $('#txtMinResumeDuration', form).val();

            ApiClient.updateServerConfiguration(config).then(Dashboard.processServerConfigurationUpdateResult);
        });

        return false;
    }

    function getTabs() {
        return [{
            href: 'encodingsettings.html',
            name: globalize.translate('Transcoding')
        }, {
            href: 'playbackconfiguration.html',
            name: globalize.translate('ButtonResume')
        }, {
            href: 'streamingsettings.html',
            name: globalize.translate('TabStreaming')
        }];
    }

    $(document).on('pageinit', '#playbackConfigurationPage', function () {
        $('.playbackConfigurationForm').off('submit', onSubmit).on('submit', onSubmit);
    }).on('pageshow', '#playbackConfigurationPage', function () {
        loading.show();
        libraryMenu.setTabs('playback', 1, getTabs);
        const page = this;
        ApiClient.getServerConfiguration().then(function (config) {
            loadPage(page, config);
        });
    });

/* eslint-enable indent */
