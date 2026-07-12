import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingService } from '../services/bookingService';
import { assetService } from '../services/assetService';
import { DashboardLayout } from '../layouts/DashboardLayout';
import type { Asset } from '../types';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Plus, Clock, Trash2, CalendarDays, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const Bookings: React.FC = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);

  // Form states (Create Booking)
  const [resourceId, setResourceId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [purpose, setPurpose] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reschedule Form States
  const [rescheduleStart, setRescheduleStart] = useState('');
  const [rescheduleEnd, setRescheduleEnd] = useState('');
  const [rescheduling, setRescheduling] = useState(false);

  // Fetch calendar events
  const { data: calendarRes, isLoading: calendarLoading } = useQuery({
    queryKey: ['bookingsCalendarList'],
    queryFn: () => bookingService.getCalendar(),
  });

  // Fetch assets list to book
  const { data: assetsRes } = useQuery({
    queryKey: ['assetsToBookList'],
    queryFn: () => assetService.search({ limit: 100 }),
  });

  const bookings = calendarRes?.data || [];
  const assets: Asset[] = assetsRes?.data || [];

  const handleOpenReschedule = (booking: any) => {
    setSelectedBooking(booking);
    const start = booking.startTime || booking.startDate;
    const end = booking.endTime || booking.endDate;
    setRescheduleStart(new Date(start).toISOString().slice(0, 16));
    setRescheduleEnd(new Date(end).toISOString().slice(0, 16));
    setRescheduleModalOpen(true);
  };

  const bookMutation = useMutation({
    mutationFn: (payload: any) => bookingService.book(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookingsCalendarList'] });
      toast.success('Resource reserved successfully!');
      setModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to book resource. Overlapping slot detected.');
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: (payload: { id: string; data: any }) => bookingService.reschedule(payload.id, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookingsCalendarList'] });
      toast.success('Reservation rescheduled.');
      setRescheduleModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to reschedule reservation. Conflict detected.');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => bookingService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookingsCalendarList'] });
      toast.success('Reservation cancelled.');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to cancel reservation.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    bookMutation.mutate(
      {
        resourceId,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        purpose,
      },
      { onSettled: () => setSubmitting(false) }
    );
  };

  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    setRescheduling(true);

    rescheduleMutation.mutate(
      {
        id: selectedBooking._id,
        data: {
          startDate: new Date(rescheduleStart).toISOString(),
          endDate: new Date(rescheduleEnd).toISOString(),
        },
      },
      { onSettled: () => setRescheduling(false) }
    );
  };

  // Convert bookings list to FullCalendar event entities
  const calendarEvents = bookings.map((b: any) => {
    const assetName = typeof b.resourceId === 'object' ? b.resourceId.name : 'Resource';
    const bookedByName = typeof b.bookedById === 'object' ? b.bookedById.name : 'User';
    return {
      id: b._id,
      title: `${assetName} - ${bookedByName}`,
      start: b.startTime || b.startDate,
      end: b.endTime || b.endDate,
      backgroundColor: b.status === 'Upcoming' ? '#4f46e5' : '#94a3b8',
      borderColor: 'transparent',
      extendedProps: b,
    };
  });

  const handleEventClick = (info: any) => {
    const props = info.event.extendedProps;
    setSelectedBooking(props);
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Resource Reservations</h2>
          <p className="text-xs text-slate-500">Coordinate shared assets, visual gear, and hardware logs.</p>
        </div>
        <button
          onClick={() => {
            setResourceId('');
            setStartDate('');
            setEndDate('');
            setPurpose('');
            setModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-100 dark:shadow-none transition-colors"
        >
          <Plus className="h-4 w-4" />
          Schedule Booking
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CALENDAR CHART GRID (left) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm lg:col-span-2 relative min-h-[500px]">
          {calendarLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 z-10">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="calendar-container text-xs">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay',
                }}
                events={calendarEvents}
                eventClick={handleEventClick}
                height="auto"
              />
            </div>
          )}
        </div>

        {/* BOOKING DETAILS INFO PANEL (right) */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-1.5">
              <CalendarDays className="h-4.5 w-4.5 text-indigo-600" />
              Reservation Inspector
            </h3>

            {selectedBooking ? (
              <div className="space-y-4 text-xs">
                <div className="bg-slate-50 dark:bg-slate-850 border border-slate-100 p-3.5 rounded-xl">
                  <p className="text-slate-500 font-medium">Resource Item:</p>
                  <p className="font-bold text-sm text-slate-800 mt-0.5">
                    {typeof selectedBooking.resourceId === 'object' ? selectedBooking.resourceId.name : 'Unknown'}
                  </p>
                  <p className="text-slate-400 mt-0.5">Tag: {typeof selectedBooking.resourceId === 'object' ? selectedBooking.resourceId.tag : 'N/A'}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-slate-500">Booked By: <strong className="text-slate-800">{typeof selectedBooking.bookedById === 'object' ? selectedBooking.bookedById.name : 'User'}</strong></p>
                  <p className="text-slate-500 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Start: <strong>{new Date(selectedBooking.startTime || selectedBooking.startDate).toLocaleString()}</strong></span>
                  </p>
                  <p className="text-slate-500 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-indigo-500" />
                    <span>End: <strong>{new Date(selectedBooking.endTime || selectedBooking.endDate).toLocaleString()}</strong></span>
                  </p>
                  <p className="text-slate-500">Purpose: <strong className="text-slate-800">{selectedBooking.reason || selectedBooking.purpose || 'N/A'}</strong></p>
                  <p className="text-slate-500">Status: <span className="px-2 py-0.5 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 font-bold rounded">{selectedBooking.status}</span></p>
                </div>

                {selectedBooking.status === 'Upcoming' && (
                  <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      onClick={() => handleOpenReschedule(selectedBooking)}
                      className="flex-1 py-2 text-center border border-slate-200 hover:bg-slate-50 rounded-xl font-semibold transition-colors"
                    >
                      Reschedule
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Cancel this reservation?')) {
                          cancelMutation.mutate(selectedBooking._id);
                          setSelectedBooking(null);
                        }
                      }}
                      className="py-2 px-3 text-red-500 hover:bg-red-50 border border-red-200/50 rounded-xl"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-10 text-center text-slate-450 text-xs italic">
                Select an event in the calendar to inspect reservation logs.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SCHEDULE BOOKING MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Schedule Reservation</h3>
            <p className="text-xs text-slate-500 mt-1">Book shared equipment during standard time slots.</p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Asset Resource */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Select Shared Resource</label>
                <select
                  required
                  value={resourceId}
                  onChange={(e) => setResourceId(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 rounded-xl text-sm focus:outline-none"
                >
                  <option value="">Select Resource</option>
                  {assets.map((asset) => (
                    <option key={asset._id} value={asset._id}>
                      {asset.name} ({asset.tag}) - {asset.status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date-Time */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Start Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 rounded-xl text-sm focus:outline-none"
                />
              </div>

              {/* End Date-Time */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">End Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 rounded-xl text-sm focus:outline-none"
                />
              </div>

              {/* Purpose */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Purpose</label>
                <input
                  type="text"
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 rounded-xl text-sm focus:outline-none"
                  placeholder="On-site video production, system builds..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Schedule Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESCHEDULE RESERVATION MODAL */}
      {rescheduleModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Reschedule Reservation</h3>
            <p className="text-xs text-slate-500 mt-1">Adjust start/end dates for this reservation slot.</p>

            <form onSubmit={handleRescheduleSubmit} className="mt-4 space-y-4">
              {/* Start */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">New Start Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={rescheduleStart}
                  onChange={(e) => setRescheduleStart(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 rounded-xl text-sm focus:outline-none"
                />
              </div>

              {/* End */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">New End Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={rescheduleEnd}
                  onChange={(e) => setRescheduleEnd(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 rounded-xl text-sm focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setRescheduleModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rescheduling}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold"
                >
                  {rescheduling && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Confirm Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
export default Bookings;
