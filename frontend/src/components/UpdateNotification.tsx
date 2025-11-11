import { useEffect, useState } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

interface UpdateInfo {
  available: boolean;
  currentVersion: string;
  latestVersion: string;
}

export default function UpdateNotification() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    try {
      const update = await check();

      if (update) {
        setUpdateInfo({
          available: true,
          currentVersion: update.currentVersion,
          latestVersion: update.version
        });
        console.log('Update available:', update.version);
      } else {
        console.log('No updates available');
      }
    } catch (err) {
      console.error('Failed to check for updates:', err);
      setError('Erreur lors de la vérification des mises à jour');
    }
  };

  const downloadAndInstall = async () => {
    try {
      setDownloading(true);
      setError(null);

      const update = await check();
      if (!update) {
        setError('Aucune mise à jour disponible');
        setDownloading(false);
        return;
      }

      console.log('Downloading update...');

      // Download with progress
      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            console.log('Download started');
            setDownloadProgress(0);
            break;
          case 'Progress':
            const progress = Math.round((event.data.downloaded / event.data.contentLength) * 100);
            setDownloadProgress(progress);
            console.log(`Download progress: ${progress}%`);
            break;
          case 'Finished':
            console.log('Download finished');
            setDownloadProgress(100);
            break;
        }
      });

      console.log('Update downloaded and installed. Restarting...');

      // Relaunch the app to apply the update
      await relaunch();
    } catch (err) {
      console.error('Failed to download and install update:', err);
      setError('Erreur lors du téléchargement de la mise à jour');
      setDownloading(false);
    }
  };

  if (error) {
    return (
      <div className="fixed bottom-4 right-4 bg-red-900/90 border border-red-500 rounded-lg p-4 shadow-lg max-w-md backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white mb-1">Erreur</h3>
            <p className="text-sm text-red-200">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="flex-shrink-0 text-red-400 hover:text-red-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  if (!updateInfo?.available) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gradient-to-br from-blue-900/90 to-purple-900/90 border border-blue-500/50 rounded-lg p-4 shadow-lg max-w-md backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>

        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white mb-1">
            Mise à jour disponible
          </h3>
          <p className="text-sm text-blue-200 mb-3">
            Version {updateInfo.latestVersion} est disponible (actuellement {updateInfo.currentVersion})
          </p>

          {downloading ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-blue-300">
                <span>Téléchargement en cours...</span>
                <span>{downloadProgress}%</span>
              </div>
              <div className="w-full bg-blue-950 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-300 ease-out"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={downloadAndInstall}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Mettre à jour
              </button>
              <button
                onClick={() => setUpdateInfo(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-blue-300 hover:text-white hover:bg-blue-800/50 transition-colors"
              >
                Plus tard
              </button>
            </div>
          )}
        </div>

        {!downloading && (
          <button
            onClick={() => setUpdateInfo(null)}
            className="flex-shrink-0 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
