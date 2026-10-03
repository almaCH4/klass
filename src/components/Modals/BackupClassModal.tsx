import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Download, Upload, Shield, CheckCircle2, AlertCircle, Loader2, Database } from 'lucide-react';

export const BackupClassModal: React.FC = () => {
  const { currentClass, exportClassBackup, importClassBackup, closeModal, isDelegate } = useApp();
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownload = async () => {
    setDownloading(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      await exportClassBackup();
      setSuccessMsg('Fichier de sauvegarde téléchargé avec succès.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors du téléchargement.');
    } finally {
      setDownloading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const text = await file.text();
      const json = JSON.parse(text);
      if (!json.classInfo || !Array.isArray(json.courses)) {
        throw new Error('Le fichier sélectionné n\'est pas un fichier de sauvegarde Klass valide.');
      }
      const res = await importClassBackup(json);
      setSuccessMsg(`Sauvegarde restaurée avec succès ! (${res.count} cours synchronisés)`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Impossible de lire ou restaurer ce fichier.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 sm:p-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Sauvegarde & Restauration JSON
              </h3>
              <p className="text-xs text-slate-500">
                {currentClass?.name} • Gestion délégués
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeModal}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 text-rose-800 border border-rose-200 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Content */}
        <div className="mt-6 space-y-4">
          
          {/* Export card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center">
                  <Download className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                  Exporter la sauvegarde de la classe
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Télécharge un fichier JSON autonome contenant les cours, les devoirs, les informations de classe et les journaux.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="mt-2 w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-sm"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Génération du fichier...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Télécharger la sauvegarde complète (JSON)</span>
                </>
              )}
            </button>
          </div>

          {/* Import card (Delegate Titulaire only) */}
          {isDelegate && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center">
                  <Upload className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                  Restaurer depuis un fichier JSON
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Réintègre l'emploi du temps et les données de classe à partir d'un fichier de sauvegarde préalablement exporté.
                </p>
              </div>

              <input
                type="file"
                accept=".json,application/json"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="mt-2 w-full py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-sm"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Restauration en cours...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Choisir un fichier JSON à restaurer</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Data storage notice */}
          <div className="p-3 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-[11px] text-slate-600 dark:text-slate-400 flex items-start space-x-2">
            <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900 dark:text-blue-300">Stockage sécurisé</p>
              <p className="mt-0.5">
                Les données de classe résident exclusivement sur le serveur sécurisé et ne sont pas stockées dans le navigateur des élèves.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
