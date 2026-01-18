
import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { CourtType, CourtRecord, SearchFilters, ScrapingLog } from './types';
import { fetchSimulatedRecords, summarizeCase } from './services/gemini';

const App: React.FC = () => {
  const [records, setRecords] = useState<CourtRecord[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<CourtRecord | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  const [filters, setFilters] = useState<SearchFilters>({
    name: '',
    case_number: '',
    county: '',
    status: '',
    start_date: '',
    end_date: '',
    court_type: undefined,
  });

  const handleSearch = async (e?: React.FormEvent, page: number = 1) => {
    if (e) e.preventDefault();
    setLoading(true);
    setCurrentPage(page);
    
    try {
      const { records: results, totalResults: total } = await fetchSimulatedRecords({ 
        ...filters, 
        page, 
        limit: ITEMS_PER_PAGE 
      });
      setRecords(results);
      setTotalResults(total);
      // Scroll to top of results
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error("Search error", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    const totalPages = Math.ceil(totalResults / ITEMS_PER_PAGE);
    if (newPage < 1 || newPage > totalPages) return;
    handleSearch(undefined, newPage);
  };

  const handleShowSummary = async (record: CourtRecord) => {
    setSummarizing(true);
    setSummary(null);
    try {
      const result = await summarizeCase(record);
      setSummary(result);
    } catch (error) {
      setSummary("Failed to generate summary.");
    } finally {
      setSummarizing(false);
    }
  };

  const closeDetail = () => {
    setSelectedRecord(null);
    setSummary(null);
    setSummarizing(false);
  };

  useEffect(() => {
    handleSearch();
  }, []);

  const totalPages = Math.ceil(totalResults / ITEMS_PER_PAGE);

  return (
    <Layout>
      <div className="space-y-12">
        {/* Page Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <h1 className="text-4xl font-bold text-slate-800 tracking-tight">Search Court Records</h1>
          <p className="text-slate-500 font-medium">Access public case data across multiple jurisdictions.</p>
        </div>

        {/* Search Bar / Filters */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={(e) => handleSearch(e, 1)} className="space-y-6">
            <div className="flex flex-col lg:flex-row items-center gap-4">
              <div className="relative flex-1 w-full">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input 
                  type="text"
                  placeholder="Search by party name..."
                  className="w-full pl-11 pr-4 py-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-700 outline-none"
                  value={filters.name || ''}
                  onChange={e => setFilters({...filters, name: e.target.value})}
                />
              </div>
              <button type="submit" className="w-full lg:w-auto px-10 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 pt-4 border-t border-gray-100">
              <div className="relative">
                <span className="absolute -top-2 left-3 px-1 bg-white text-[10px] font-bold text-gray-400 uppercase tracking-widest z-10">Court Type</span>
                <select 
                  className="w-full px-4 py-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-600 transition-all appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22/%3E%3C/svg%3E')] bg-[length:12px] bg-[right_1.5rem_center] bg-no-repeat"
                  value={filters.court_type || ''}
                  onChange={e => setFilters({...filters, court_type: e.target.value as CourtType || undefined})}
                >
                  <option value="">All Courts</option>
                  <option value={CourtType.CLERK}>{CourtType.CLERK}</option>
                  <option value={CourtType.COMMON_PLEAS}>{CourtType.COMMON_PLEAS}</option>
                  <option value={CourtType.COUNTY}>{CourtType.COUNTY}</option>
                  <option value={CourtType.PROBATE}>{CourtType.PROBATE}</option>
                </select>
              </div>

              <div className="relative">
                <span className="absolute -top-2 left-3 px-1 bg-white text-[10px] font-bold text-gray-400 uppercase tracking-widest z-10">Case Number</span>
                <input 
                  type="text"
                  placeholder="e.g. 2024-CV-001"
                  className="w-full px-4 py-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 transition-all placeholder:text-gray-300"
                  value={filters.case_number || ''}
                  onChange={e => setFilters({...filters, case_number: e.target.value})}
                />
              </div>

              <div className="relative">
                 <span className="absolute -top-2 left-3 px-1 bg-white text-[10px] font-bold text-gray-400 uppercase tracking-widest z-10">Jurisdiction</span>
                <select 
                  className="w-full px-4 py-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-600 transition-all appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22/%3E%3C/svg%3E')] bg-[length:12px] bg-[right_1.5rem_center] bg-no-repeat"
                  value={filters.county}
                  onChange={e => setFilters({...filters, county: e.target.value})}
                >
                  <option value="">All Counties</option>
                  <option value="Adams">Adams</option>
                  <option value="Franklin">Franklin</option>
                  <option value="Hamilton">Hamilton</option>
                </select>
              </div>

              <div className="relative">
                <span className="absolute -top-2 left-3 px-1 bg-white text-[10px] font-bold text-gray-400 uppercase tracking-widest z-10">Case Status</span>
                <select 
                  className="w-full px-4 py-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-600 transition-all appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22/%3E%3C/svg%3E')] bg-[length:12px] bg-[right_1.5rem_center] bg-no-repeat"
                  value={filters.status}
                  onChange={e => setFilters({...filters, status: e.target.value})}
                >
                  <option value="">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div className="relative w-full">
                <span className="absolute -top-2 left-3 px-1 bg-white text-[10px] font-bold text-gray-400 uppercase tracking-widest z-10">Start Date</span>
                <input 
                  type="date"
                  className="w-full px-4 py-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-600 transition-all"
                  value={filters.start_date || ''}
                  onChange={e => setFilters({...filters, start_date: e.target.value})}
                />
              </div>

              <div className="relative w-full">
                <span className="absolute -top-2 left-3 px-1 bg-white text-[10px] font-bold text-gray-400 uppercase tracking-widest z-10">End Date</span>
                <input 
                  type="date"
                  className="w-full px-4 py-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-600 transition-all"
                  value={filters.end_date || ''}
                  onChange={e => setFilters({...filters, end_date: e.target.value})}
                />
              </div>
            </div>
          </form>
        </section>

        {/* Results Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h2 className="text-2xl font-bold text-slate-800">Results ({totalResults} total matches)</h2>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Showing {records.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} - {Math.min(currentPage * ITEMS_PER_PAGE, totalResults)}
          </div>
        </div>

        {/* Results List */}
        <section className="space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-6">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <svg className="w-8 h-8 text-blue-600/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-xl font-bold text-slate-800 animate-pulse">Scanning Public Records...</p>
                <p className="text-slate-400 font-medium">Querying legal databases across multiple jurisdictions.</p>
              </div>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-gray-300 flex flex-col items-center justify-center space-y-4">
              <div className="p-4 bg-slate-50 rounded-full">
                <svg className="w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="space-y-1">
                <p className="text-slate-800 font-bold text-lg">No records match your criteria</p>
                <p className="text-slate-400">Try adjusting your filters or searching for a different name.</p>
              </div>
            </div>
          ) : (
            <>
              {records.map((record) => (
                <div key={record.id} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 relative group hover:border-blue-200 hover:shadow-xl hover:shadow-slate-100 transition-all duration-300">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="space-y-6 flex-1">
                      <div className="flex items-center gap-4">
                        <h3 className="text-2xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{record.case_number}</h3>
                        <span className={`px-4 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${
                          record.status.toLowerCase() === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          record.status.toLowerCase() === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          'bg-slate-50 text-slate-600 border border-slate-200'
                        }`}>
                          {record.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-12">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">County</span>
                          <span className="text-slate-800 font-semibold">{record.county}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Plaintiff</span>
                          <span className="text-slate-800 font-semibold truncate max-w-[200px]" title={record.plaintiff}>{record.plaintiff}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Defendant</span>
                          <span className="text-slate-800 font-semibold truncate max-w-[200px]" title={record.defendant}>{record.defendant}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Filing Date</span>
                          <span className="text-slate-800 font-semibold">{record.filing_date}</span>
                        </div>
                        <div className="flex flex-col col-span-full">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Charges</span>
                          <span className="text-slate-800 font-semibold">{record.charges || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 md:w-48">
                      <button 
                        onClick={() => setSelectedRecord(record)}
                        className="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-50 border border-blue-500"
                      >
                        View Details
                      </button>
                      <button 
                        onClick={() => handleShowSummary(record)}
                        className="w-full px-6 py-3 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-all border border-blue-100"
                      >
                        AI Summary
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Pagination Controls */}
              <div className="flex items-center justify-center gap-6 py-8">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
                
                <div className="flex items-center gap-4 px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Page</span>
                    <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-white text-blue-600 font-bold border border-blue-100 shadow-sm">
                      {currentPage}
                    </span>
                  </div>
                  <div className="h-4 w-px bg-slate-200"></div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Of</span>
                    <span className="text-slate-800 font-bold">{totalPages}</span>
                  </div>
                </div>

                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={loading || currentPage >= totalPages}
                  className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  Next
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </section>

        {/* Detail Modal */}
        {selectedRecord && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={closeDetail}></div>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden relative animate-in fade-in zoom-in duration-300 flex flex-col">
              {/* Modal Header */}
              <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 rounded-2xl">
                     <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">{selectedRecord.case_number}</h2>
                    <p className="text-sm text-slate-400 font-medium">{selectedRecord.court_type}</p>
                  </div>
                </div>
                <button onClick={closeDetail} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                <div className="grid grid-cols-2 gap-y-10 gap-x-12">
                  <DetailField label="County" value={selectedRecord.county} />
                  <DetailField label="Status" value={selectedRecord.status} isPill />
                  <DetailField label="Plaintiff" value={selectedRecord.plaintiff} />
                  <DetailField label="Defendant" value={selectedRecord.defendant} />
                  <DetailField label="Filing Date" value={selectedRecord.filing_date} />
                  <DetailField label="Charges" value={selectedRecord.charges || 'N/A'} />
                </div>

                <div className="space-y-4 pt-6 border-t border-gray-100">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Case Description</h4>
                  <div className="bg-slate-50 rounded-2xl p-6 text-slate-700 leading-relaxed border border-slate-100 font-medium">
                    {selectedRecord.details}
                  </div>
                </div>

                {/* AI Summary Section */}
                <section className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-blue-200">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                  </div>
                  
                  <h3 className="text-white text-xl font-bold mb-6 flex items-center gap-3">
                    <span className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">✨</span> 
                    Intelligent Case Summary
                  </h3>
                  
                  {summary ? (
                    <div className="text-blue-50 text-lg leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-500 font-medium">
                      {summary}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-blue-100 opacity-80">Our AI can analyze the complex details of this case to provide a concise, high-level overview.</p>
                      <button 
                        onClick={() => handleShowSummary(selectedRecord)}
                        disabled={summarizing}
                        className="w-full bg-white text-blue-700 py-4 rounded-xl font-bold hover:bg-blue-50 transition-all flex items-center justify-center space-x-2 shadow-lg disabled:opacity-50"
                      >
                        {summarizing ? (
                          <>
                            <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Synthesizing Data...</span>
                          </>
                        ) : (
                          <span>Generate Executive Summary</span>
                        )}
                      </button>
                    </div>
                  )}
                </section>
              </div>

              {/* Modal Footer */}
              <div className="px-8 py-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
                <a 
                  href={selectedRecord.links?.[0]} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 font-bold hover:underline flex items-center gap-1 text-sm"
                >
                  View Original Filing
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <button 
                  onClick={closeDetail}
                  className="px-10 py-3 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-900 transition-all shadow-lg shadow-slate-200"
                >
                  Close Record
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

const DetailField: React.FC<{ label: string; value: string; isPill?: boolean }> = ({ label, value, isPill }) => (
  <div className="space-y-1">
    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">{label}</h4>
    {isPill ? (
      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
        value.toLowerCase() === 'active' ? 'bg-emerald-100 text-emerald-700' :
        value.toLowerCase() === 'pending' ? 'bg-amber-100 text-amber-700' :
        'bg-slate-100 text-slate-600'
      }`}>
        {value}
      </span>
    ) : (
      <p className="text-slate-800 font-bold text-lg leading-tight">{value}</p>
    )}
  </div>
);

export default App;
