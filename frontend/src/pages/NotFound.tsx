import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowRight } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-55 flex flex-col justify-center items-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-8 text-center shadow-xl">
        <div className="bg-indigo-50 p-4 rounded-full text-indigo-650 inline-block mb-4">
          <HelpCircle className="h-10 w-10 animate-bounce" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Resource Not Found</h2>
        <p className="text-sm text-slate-500 mt-2">
          The page or system endpoint you requested does not exist.
        </p>

        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-650 hover:bg-indigo-755 text-white rounded-xl text-sm font-semibold transition-all duration-200"
        >
          Return to Dashboard
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};
export default NotFound;
