
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase, fetchAllData, getEstablishmentInfoForUser, createEstablishmentForNewUser, updateEstablishmentInfo, upsertTrainee, upsertGroups, deleteGroupsByFiliereAndYear, upsertAllData, deleteTraineeById, getAssistants, addAssistant, deleteAssistant, upsertArchivedYear, deleteArchivedYear } from './supabase';
import { Auth } from './Auth';
import type { Session } from '@supabase/supabase-js';
import type { TrainingData, ArchivedData, Trainee, Group, Filiere, Level, BehaviorIncident, AbsenceType, User } from './types';
import { DAYS, SESSIONS, SESSION_DURATION, RETARD_VALUE, initialTrainees, initialGroups, initialFilieres, initialLevels } from './constants';

declare const xlsx: any;
declare const jspdf: any;
declare const html2canvas: any;

// Utility Functions
const getWeekNumber = (d: Date) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
};

const getWeekDates = (week: number, year: number) => {
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = simple;
    if (dow <= 4)
        ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    else
        ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());

    const dates = [];
    for (let i = 0; i < 6; i++) {
        const d = new Date(ISOweekStart);
        d.setDate(d.getDate() + i);
        dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
};

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [establishment, setEstablishment] = useState<any>(null);
  const [allData, setAllData] = useState<TrainingData>({ levels: [], filieres: [], groups: [], trainees: [] });
  const [archivedData, setArchivedData] = useState<ArchivedData>({});
  const [currentTrainingYear, setCurrentTrainingYear] = useState<string>('2023-2024');
  const [assistants, setAssistants] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<'superAdmin' | 'assistant' | null>(null);
  
  const establishmentId = establishment?.id;

  const loadInitialData = useCallback(async (currentSession: Session) => {
    // 1. Determine user role and get establishment info
    let establishmentInfo = await getEstablishmentInfoForUser(currentSession.user.id);
    let role: 'superAdmin' | 'assistant' = 'superAdmin';

    if (!establishmentInfo) {
      // Potentially an assistant, need to check
      const { data: assistantData, error } = await supabase.from('assistants').select('*, establishment:establishments(*)').eq('email', currentSession.user.email).single();
      if(assistantData) {
        establishmentInfo = assistantData.establishment;
        role = 'assistant';
      }
    }
    
    // If still no establishment, this is a new Super Admin
    if (!establishmentInfo) {
        const establishmentName = currentSession.user.user_metadata?.full_name 
            ? `${currentSession.user.user_metadata.full_name}'s Establishment`
            : `${currentSession.user.email}'s Establishment`;
        establishmentInfo = await createEstablishmentForNewUser(currentSession.user.id, establishmentName);
        role = 'superAdmin';
    }
    
    setEstablishment(establishmentInfo);
    setUserRole(role);
    
    // 2. Fetch all data for the establishment
    if (establishmentInfo) {
        const { allData: fetchedAllData, archivedData: fetchedArchivedData } = await fetchAllData(establishmentInfo.id);
        setAllData(fetchedAllData);
        setArchivedData(fetchedArchivedData);
        if (role === 'superAdmin') {
            const fetchedAssistants = await getAssistants(establishmentInfo.id);
            setAssistants(fetchedAssistants);
        }
    }
  }, []);


  useEffect(() => {
    setLoading(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        loadInitialData(session).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setLoading(true);
        loadInitialData(session).finally(() => setLoading(false));
      } else {
        setEstablishment(null);
        setAllData({ levels: [], filieres: [], groups: [], trainees: [] });
        setArchivedData({});
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadInitialData]);
  
   const handleUpdateTrainee = useCallback(async (updatedTrainee: Trainee) => {
        setAllData(prevData => ({
            ...prevData,
            trainees: prevData.trainees.map(t => t.id === updatedTrainee.id ? updatedTrainee : t),
        }));
        // FIX: The object literal had an extra property 'establishment_id' which is not in the Trainee type,
        // causing a TypeScript error. By creating an intermediate variable, we bypass the strict object literal check.
        const traineeToUpsert = { ...updatedTrainee, establishment_id: establishmentId };
        await upsertTrainee(traineeToUpsert);
    }, [establishmentId]);

    const handleUpdateGroups = useCallback(async (updatedGroups: Group[]) => {
        setAllData(prevData => {
            const updatedGroupIds = new Set(updatedGroups.map(g => g.id));
            const otherGroups = prevData.groups.filter(g => !updatedGroupIds.has(g.id));
            return {
                ...prevData,
                groups: [...otherGroups, ...updatedGroups],
            };
        });
        await upsertGroups(updatedGroups.map(g => ({ ...g, establishment_id: establishmentId })));
    }, [establishmentId]);

    const handleDeleteGroups = useCallback(async (filiereId: string, trainingYear: string) => {
        setAllData(prevData => {
            const groupsToDelete = prevData.groups.filter(g => g.filiereId === filiereId && g.trainingYear === trainingYear);
            const groupIdsToDelete = new Set(groupsToDelete.map(g => g.id));
            return {
                ...prevData,
                groups: prevData.groups.filter(g => !(g.filiereId === filiereId && g.trainingYear === trainingYear)),
                trainees: prevData.trainees.filter(t => !groupIdsToDelete.has(t.groupId)),
            };
        });
        await deleteGroupsByFiliereAndYear(filiereId, trainingYear);
    }, []);

    const handleAddTrainees = useCallback(async (newTrainees: Trainee[]) => {
        setAllData(prevData => ({
            ...prevData,
            trainees: [...prevData.trainees, ...newTrainees]
        }));
        await upsertAllData(establishmentId, { ...allData, trainees: [...allData.trainees, ...newTrainees] });
    }, [establishmentId, allData]);

    const handleDeleteTrainee = useCallback(async (traineeId: string) => {
        setAllData(prevData => ({
            ...prevData,
            trainees: prevData.trainees.filter(t => t.id !== traineeId),
        }));
        await deleteTraineeById(traineeId);
    }, []);
    
    const handleAddAssistant = useCallback(async (name: string, email: string) => {
        const newAssistant = await addAssistant(establishmentId, name, email);
        if (newAssistant) {
            setAssistants(prev => [...prev, newAssistant]);
        }
    }, [establishmentId]);

    const handleDeleteAssistant = useCallback(async (email: string) => {
        setAssistants(prev => prev.filter(a => a.email !== email));
        await deleteAssistant(email);
    }, []);

    const handleArchiveYear = useCallback(async (year: string) => {
        const dataToArchive: TrainingData = {
            levels: allData.levels,
            filieres: allData.filieres,
            groups: allData.groups.filter(g => g.trainingYear === year),
            trainees: allData.trainees.filter(t => allData.groups.find(g => g.id === t.groupId)?.trainingYear === year),
        };
        setArchivedData(prev => ({...prev, [year]: dataToArchive }));
        await upsertArchivedYear(establishmentId, year, dataToArchive);
        // Optionally clear the archived data from active data
        setAllData(prev => ({
            ...prev,
            groups: prev.groups.filter(g => g.trainingYear !== year),
            trainees: prev.trainees.filter(t => !dataToArchive.trainees.find(at => at.id === t.id)),
        }));
    }, [allData, establishmentId]);

    const handleDeleteArchive = useCallback(async (year: string) => {
        const newArchivedData = { ...archivedData };
        delete newArchivedData[year];
        setArchivedData(newArchivedData);
        await deleteArchivedYear(establishmentId, year);
    }, [archivedData, establishmentId]);

    const handleRestoreArchive = useCallback(async (year: string) => {
        const dataToRestore = archivedData[year];
        if (!dataToRestore) return;
        
        const restoredData: TrainingData = {
            levels: [...allData.levels, ...dataToRestore.levels.filter(l => !allData.levels.find(al => al.id === l.id))],
            filieres: [...allData.filieres, ...dataToRestore.filieres.filter(f => !allData.filieres.find(af => af.id === f.id))],
            groups: [...allData.groups, ...dataToRestore.groups],
            trainees: [...allData.trainees, ...dataToRestore.trainees],
        };

        setAllData(restoredData);
        await upsertAllData(establishmentId, restoredData);
        await handleDeleteArchive(year);

    }, [allData, archivedData, establishmentId, handleDeleteArchive]);
    
    const handleUpdateEstablishment = useCallback(async (name: string, logoUrl: string | null) => {
        const updatedEstablishment = { ...establishment, name, logo_url: logoUrl };
        setEstablishment(updatedEstablishment);
        await updateEstablishmentInfo(session!.user.id, { name, logo_url: logoUrl });
    }, [establishment, session]);


  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <div className="text-xl font-semibold text-gray-700">Chargement de votre espace...</div>
        </div>
    );
  }

  if (!session) {
    return <Auth />;
  }
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <MainApp
        user={session.user}
        userRole={userRole}
        establishment={establishment}
        allData={allData}
        archivedData={archivedData}
        currentTrainingYear={currentTrainingYear}
        setCurrentTrainingYear={setCurrentTrainingYear}
        assistants={assistants}
        onLogout={handleLogout}
        onUpdateTrainee={handleUpdateTrainee}
        onUpdateGroups={handleUpdateGroups}
        onDeleteGroups={handleDeleteGroups}
        onAddTrainees={handleAddTrainees}
        onDeleteTrainee={handleDeleteTrainee}
        onAddAssistant={handleAddAssistant}
        onDeleteAssistant={handleDeleteAssistant}
        onArchiveYear={handleArchiveYear}
        onDeleteArchive={handleDeleteArchive}
        onRestoreArchive={handleRestoreArchive}
        onUpdateEstablishment={handleUpdateEstablishment}
    />
  );
};

// Main Application Component
const MainApp = (props: any) => {
    const [activeTab, setActiveTab] = useState('Tableau de Bord');
    const TABS = ['Tableau de Bord', 'Saisie', 'Assiduité', 'Comportement', 'Données Personnelles', 'Historique', 'Paramètres'];
    if (props.userRole === 'superAdmin') TABS.push('Admin');

    const renderContent = () => {
        switch (activeTab) {
            case 'Tableau de Bord': return <DashboardView {...props} />;
            case 'Saisie': return <SaisieView {...props} />;
            case 'Assiduité': return <AssiduiteView {...props} />;
            case 'Comportement': return <ComportementView {...props} />;
            case 'Données Personnelles': return <DonneesPersonnellesView {...props} />;
            case 'Historique': return <HistoryView {...props} />;
            case 'Paramètres': return <ParametresView {...props} />;
            case 'Admin': return props.userRole === 'superAdmin' ? <AdminView {...props} /> : null;
            default: return <DashboardView {...props} />;
        }
    };

    return (
        <div className="min-h-screen bg-slate-100">
            <Header {...props} />
            <NavTabs tabs={TABS} activeTab={activeTab} setActiveTab={setActiveTab} />
            <main className="p-4 sm:p-6 lg:p-8">
                {renderContent()}
            </main>
        </div>
    );
}

const Header = ({ user, establishment, onLogout }: any) => (
    <header className="bg-blue-800 text-white p-4 flex justify-between items-center shadow-md print:hidden">
        <div>
            <h1 className="text-2xl font-bold">Gestion des Absences</h1>
            <p className="text-sm opacity-90">{establishment?.name || "Nom de l'établissement"}</p>
        </div>
        <div className="flex items-center">
            <div className="text-right mr-4">
                <p className="font-semibold">{user.user_metadata?.full_name || user.email}</p>
                <p className="text-xs opacity-90">{user.email}</p>
            </div>
            {establishment?.logo_url ? (
                <img src={establishment.logo_url} alt="Logo" className="w-10 h-10 rounded-full mr-4 bg-white object-cover" />
            ) : (
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xl mr-4">
                    {establishment?.name?.[0]?.toUpperCase() || 'E'}
                </div>
            )}
            <button onClick={onLogout} className="bg-blue-600 hover:bg-blue-500 rounded-md p-2 transition-colors" aria-label="Déconnexion">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
        </div>
    </header>
);

const NavTabs = ({ tabs, activeTab, setActiveTab }: any) => (
    <nav className="bg-white shadow-md print:hidden">
        <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-start space-x-4 overflow-x-auto no-scrollbar">
                {tabs.map((tab: string) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`py-4 px-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                            activeTab === tab 
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
        </div>
    </nav>
);

// --- VIEW COMPONENTS ---

const DashboardView = (props: any) => {
    return <div className="bg-white p-6 rounded-lg shadow">Component DashboardView is not fully implemented.</div>
};

const SaisieView = (props: any) => {
    return <div className="bg-white p-6 rounded-lg shadow">Component SaisieView is not fully implemented.</div>
};

const AssiduiteView = (props: any) => {
    return <div className="bg-white p-6 rounded-lg shadow">Component AssiduiteView is not fully implemented.</div>
};

const ComportementView = (props: any) => {
    return <div className="bg-white p-6 rounded-lg shadow">Component ComportementView is not fully implemented.</div>
};

const DonneesPersonnellesView = ({ allData, onUpdateTrainee }: {allData: TrainingData, onUpdateTrainee: (trainee: Trainee) => void}) => {
    const [selectedTrainee, setSelectedTrainee] = useState<Trainee | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const printableRef = useRef(null);

    const filteredTrainees = useMemo(() => 
        allData.trainees.filter(t => 
            `${t.firstName} ${t.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.cef.toLowerCase().includes(searchTerm.toLowerCase())
        ), [allData.trainees, searchTerm]);

    const handlePrint = () => {
        window.print();
    };

    const handleExportPdf = () => {
        const element = printableRef.current;
        if (!element) return;
        html2canvas(element).then((canvas: any) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jspdf.jsPDF();
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${selectedTrainee?.firstName}_${selectedTrainee?.lastName}_fiche.pdf`);
        });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white p-4 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">Liste des Stagiaires</h2>
                <input 
                    type="text"
                    placeholder="Rechercher par nom ou CEF..."
                    className="w-full p-2 border rounded-md mb-4"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                <ul className="max-h-96 overflow-y-auto">
                    {filteredTrainees.map(trainee => (
                        <li key={trainee.id} 
                            className={`p-2 rounded-md cursor-pointer ${selectedTrainee?.id === trainee.id ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                            onClick={() => setSelectedTrainee(trainee)}>
                            {trainee.firstName} {trainee.lastName}
                        </li>
                    ))}
                </ul>
            </div>
            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow" id="printable-area" ref={printableRef}>
                {selectedTrainee ? (
                    <div id="fiche-individuelle">
                        <h2 className="text-2xl font-bold mb-2">Fiche Individuelle du Stagiaire</h2>
                        <div className="flex justify-end space-x-2 print:hidden">
                            <button onClick={handlePrint} className="bg-gray-200 p-2 rounded-md hover:bg-gray-300">Imprimer</button>
                            <button onClick={handleExportPdf} className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700">Exporter PDF</button>
                        </div>
                        <div className="mt-4 border-t pt-4">
                            <p><strong>Nom Complet:</strong> {selectedTrainee.firstName} {selectedTrainee.lastName}</p>
                            <p><strong>CEF:</strong> {selectedTrainee.cef}</p>
                            <p><strong>Date de Naissance:</strong> {selectedTrainee.birthDate}</p>
                            <p><strong>Groupe:</strong> {allData.groups.find(g => g.id === selectedTrainee.groupId)?.name}</p>
                        </div>
                        <div className="mt-6">
                            <h3 className="text-lg font-semibold">Absences</h3>
                             <p className="text-gray-600">Détail des absences à implémenter.</p>
                        </div>
                        <div className="mt-6">
                            <h3 className="text-lg font-semibold">Comportement</h3>
                            {selectedTrainee.behavior && selectedTrainee.behavior.length > 0 ? (
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    {selectedTrainee.behavior.map((b, index) => (
                                        <li key={index}><strong>{b.date}:</strong> {b.motif} - <em>Sanction: {b.sanction}</em></li>
                                    ))}
                                </ul>
                            ) : <p className="text-gray-500">Aucun incident de comportement.</p>}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">Sélectionnez un stagiaire pour voir sa fiche.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const HistoryView = ({ archivedData, onDeleteArchive, onRestoreArchive }: any) => {
    const years = Object.keys(archivedData);
    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4">Historique des Archives</h2>
            {years.length > 0 ? (
                <ul className="space-y-3">
                    {years.map(year => (
                        <li key={year} className="p-4 border rounded-md flex justify-between items-center">
                            <span className="font-semibold text-lg">Année de formation: {year}</span>
                            <div className="space-x-2">
                                <button className="bg-gray-200 p-2 rounded hover:bg-gray-300">Consulter</button>
                                <button onClick={() => onRestoreArchive(year)} className="bg-green-500 text-white p-2 rounded hover:bg-green-600">Restaurer</button>
                                <button onClick={() => onDeleteArchive(year)} className="bg-red-500 text-white p-2 rounded hover:bg-red-600">Supprimer</button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : <p className="text-gray-500">Aucune année n'a été archivée.</p>}
        </div>
    );
};

const ParametresView = (props: any) => {
    const { allData, currentTrainingYear, onUpdateEstablishment, establishment, onDeleteGroups, onUpdateGroups, onAddTrainees, onDeleteTrainee, onArchiveYear, userRole } = props;
    // FIX: Cast sort parameters `a` and `b` to string to use `localeCompare`.
    // The parameters were inferred as `unknown` because `allData` comes from `props: any`.
    const trainingYears = useMemo(() => Array.from(new Set(allData.groups.map((g: Group) => g.trainingYear))).sort((a, b) => (b || "").localeCompare(a || "")), [allData.groups]);

    const handleImportTrainees = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = xlsx.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json: any[] = xlsx.utils.sheet_to_json(worksheet);

            const newTrainees: Trainee[] = json.map((row, index) => ({
                id: `T-${Date.now()}-${index}`,
                cef: row.CEF || `CEF-${index}`,
                firstName: row.Prénom || '',
                lastName: row.Nom || '',
                birthDate: '2000-01-01', // Placeholder
                groupId: row.GroupeID || '',
                absences: {},
            }));
            onAddTrainees(newTrainees);
            alert(`${newTrainees.length} stagiaires importés avec succès!`);
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <div className="space-y-8">
            {userRole === 'superAdmin' && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-bold mb-4">Informations Générales</h2>
                    <form onSubmit={(e) => { e.preventDefault(); onUpdateEstablishment(e.currentTarget.establishmentName.value, e.currentTarget.logoUrl.value); }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nom de l'établissement</label>
                                <input type="text" name="establishmentName" defaultValue={establishment?.name} className="mt-1 w-full p-2 border rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">URL du Logo</label>
                                <input type="text" name="logoUrl" defaultValue={establishment?.logo_url} className="mt-1 w-full p-2 border rounded-md" />
                            </div>
                        </div>
                        <button type="submit" className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">Enregistrer</button>
                    </form>
                </div>
            )}
            
            <div className="bg-white p-6 rounded-lg shadow">
                 <h2 className="text-xl font-bold mb-4">Gestion des Stagiaires</h2>
                 <div className="flex items-center space-x-4">
                     <label htmlFor="import-excel" className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 cursor-pointer">
                         Importer depuis Excel
                     </label>
                     <input type="file" id="import-excel" className="hidden" accept=".xlsx, .xls" onChange={handleImportTrainees} />
                     <button className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">Ajouter un stagiaire</button>
                 </div>
                 {/* Table of trainees for editing/deleting could go here */}
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">Archivage</h2>
                <p className="text-gray-600 mb-4">Archivez les données de l'année de formation sélectionnée. Cette action est irréversible depuis cette interface.</p>
                 <div className="flex items-center space-x-4">
                    <select className="p-2 border rounded-md">
                        {trainingYears.map(year => <option key={year} value={year}>{year}</option>)}
                    </select>
                    <button onClick={() => onArchiveYear(currentTrainingYear)} className="bg-amber-500 text-white py-2 px-4 rounded-md hover:bg-amber-600">Archiver l'année sélectionnée</button>
                 </div>
            </div>
        </div>
    );
};

const AdminView = ({ assistants, onAddAssistant, onDeleteAssistant }: any) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        onAddAssistant(name, email);
        setName('');
        setEmail('');
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">Ajouter un Assistant</h2>
                <form onSubmit={handleAdd} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nom complet</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full p-2 border rounded-md" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full p-2 border rounded-md" required />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">Ajouter</button>
                </form>
            </div>
            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">Liste des Assistants</h2>
                <ul className="space-y-2">
                    {assistants.map((assistant: any) => (
                        <li key={assistant.id} className="p-3 border rounded-md flex justify-between items-center">
                            <div>
                                <p className="font-semibold">{assistant.name}</p>
                                <p className="text-sm text-gray-500">{assistant.email}</p>
                            </div>
                            <button onClick={() => onDeleteAssistant(assistant.email)} className="text-red-500 hover:text-red-700">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};


export default App;
