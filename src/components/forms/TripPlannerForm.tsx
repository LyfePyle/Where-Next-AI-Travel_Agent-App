'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Calendar, Users, DollarSign, MapPin, Plane, Clock } from 'lucide-react';
import { tripPlannerSchema, type TripPlannerFormData, vibeOptions } from '@/lib/validations/trip';
import AirportAutocomplete from '@/components/AirportAutocomplete';

interface TripPlannerFormProps {
  onSubmit?: (data: TripPlannerFormData) => void;
  isLoading?: boolean;
}

export default function TripPlannerForm({ onSubmit, isLoading = false }: TripPlannerFormProps) {
  const router = useRouter();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<TripPlannerFormData>({
    resolver: zodResolver(tripPlannerSchema),
    defaultValues: {
      originAirport: '',
      dateRange: {
        startDate: '',
        endDate: '',
      },
      budgetTotal: 2000,
      vibes: [],
      partySize: {
        adults: 2,
        kids: 0,
      },
      maxFlightTime: 12,
      visaRequired: false,
      additionalDetails: '',
    },
    mode: 'onChange',
  });

  const selectedVibes = watch('vibes');

  const handleVibeToggle = (vibeId: string) => {
    const currentVibes = selectedVibes || [];
    const updatedVibes = currentVibes.includes(vibeId)
      ? currentVibes.filter(v => v !== vibeId)
      : [...currentVibes, vibeId];
    setValue('vibes', updatedVibes);
  };

  const onSubmitForm = async (data: TripPlannerFormData) => {
    if (onSubmit) {
      onSubmit(data);
    } else {
      // Default behavior: navigate to suggestions
      const params = new URLSearchParams({
        from: data.originAirport,
        startDate: data.dateRange.startDate,
        endDate: data.dateRange.endDate,
        budget: data.budgetTotal.toString(),
        vibes: data.vibes.join(','),
        adults: data.partySize.adults.toString(),
        kids: data.partySize.kids.toString(),
        ...(data.maxFlightTime && { maxFlightTime: data.maxFlightTime.toString() }),
        ...(data.additionalDetails && { details: data.additionalDetails }),
      });

      router.push(`/suggestions?${params.toString()}`);
    }
  };

  // Calculate trip duration
  const startDate = watch('dateRange.startDate');
  const endDate = watch('dateRange.endDate');
  const tripDuration = startDate && endDate 
    ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-8">
      {/* Origin Airport */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          <MapPin className="inline w-4 h-4 mr-1" />
          Where are you traveling from?
        </label>
        <Controller
          name="originAirport"
          control={control}
          render={({ field }) => (
            <AirportAutocomplete
              value={field.value}
              onChange={field.onChange}
              placeholder="Enter city or airport code..."
              className={errors.originAirport ? 'border-red-500' : ''}
            />
          )}
        />
        {errors.originAirport && (
          <p className="text-sm text-red-600">{errors.originAirport.message}</p>
        )}
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <Calendar className="inline w-4 h-4 mr-1" />
            Departure Date
          </label>
          <Controller
            name="dateRange.startDate"
            control={control}
            render={({ field }) => (
              <input
                type="date"
                {...field}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.dateRange?.startDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            )}
          />
          {errors.dateRange?.startDate && (
            <p className="text-sm text-red-600">{errors.dateRange.startDate.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Return Date
          </label>
          <Controller
            name="dateRange.endDate"
            control={control}
            render={({ field }) => (
              <input
                type="date"
                {...field}
                min={startDate || new Date().toISOString().split('T')[0]}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.dateRange?.endDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            )}
          />
          {errors.dateRange?.endDate && (
            <p className="text-sm text-red-600">{errors.dateRange.endDate.message}</p>
          )}
          {tripDuration > 0 && (
            <p className="text-sm text-gray-600">{tripDuration} day{tripDuration !== 1 ? 's' : ''}</p>
          )}
        </div>
      </div>

      {/* Budget */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          <DollarSign className="inline w-4 h-4 mr-1" />
          Total Budget (USD)
        </label>
        <Controller
          name="budgetTotal"
          control={control}
          render={({ field }) => (
            <div className="space-y-3">
              <input
                type="range"
                min="100"
                max="10000"
                step="100"
                value={field.value}
                onChange={(e) => field.onChange(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-sm text-gray-600">
                <span>$100</span>
                <span className="font-semibold text-purple-600">${field.value.toLocaleString()}</span>
                <span>$10,000+</span>
              </div>
              <input
                type="number"
                value={field.value}
                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                min="100"
                max="50000"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.budgetTotal ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter amount..."
              />
            </div>
          )}
        />
        {errors.budgetTotal && (
          <p className="text-sm text-red-600">{errors.budgetTotal.message}</p>
        )}
      </div>

      {/* Vibes */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          What kind of trip vibe are you looking for?
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {vibeOptions.map((vibe) => (
            <button
              key={vibe.id}
              type="button"
              onClick={() => handleVibeToggle(vibe.id)}
              className={`p-3 rounded-lg border-2 text-sm font-medium transition-all duration-200 ${
                selectedVibes.includes(vibe.id)
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-25'
              }`}
            >
              <div className="text-lg mb-1">{vibe.icon}</div>
              <div>{vibe.label}</div>
            </button>
          ))}
        </div>
        {errors.vibes && (
          <p className="text-sm text-red-600">{errors.vibes.message}</p>
        )}
      </div>

      {/* Party Size */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          <Users className="inline w-4 h-4 mr-1" />
          Who's traveling?
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Adults</label>
            <Controller
              name="partySize.adults"
              control={control}
              render={({ field }) => (
                <input
                  type="number"
                  {...field}
                  min="1"
                  max="10"
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.partySize?.adults ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              )}
            />
            {errors.partySize?.adults && (
              <p className="text-xs text-red-600">{errors.partySize.adults.message}</p>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Children (under 18)</label>
            <Controller
              name="partySize.kids"
              control={control}
              render={({ field }) => (
                <input
                  type="number"
                  {...field}
                  min="0"
                  max="10"
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.partySize?.kids ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              )}
            />
            {errors.partySize?.kids && (
              <p className="text-xs text-red-600">{errors.partySize.kids.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Options */}
      <div className="border-t pt-6">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center text-sm text-gray-600 hover:text-purple-600 transition-colors"
        >
          <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Options</span>
          <span className="ml-1">{showAdvanced ? '▲' : '▼'}</span>
        </button>

        {showAdvanced && (
          <div className="mt-4 space-y-4">
            {/* Max Flight Time */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <Plane className="inline w-4 h-4 mr-1" />
                Maximum Flight Time (hours)
              </label>
              <Controller
                name="maxFlightTime"
                control={control}
                render={({ field }) => (
                  <input
                    type="number"
                    {...field}
                    min="1"
                    max="24"
                    onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., 12"
                  />
                )}
              />
            </div>

            {/* Additional Details */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Additional Details or Preferences
              </label>
              <Controller
                name="additionalDetails"
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Any specific requests, accessibility needs, or preferences..."
                  />
                )}
              />
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-center pt-6">
        <button
          type="submit"
          disabled={!isValid || isLoading}
          className={`px-8 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
            !isValid || isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700 hover:shadow-lg'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Generating AI Suggestions...
            </div>
          ) : (
            'Get AI Trip Suggestions ✨'
          )}
        </button>
      </div>
    </form>
  );
}
