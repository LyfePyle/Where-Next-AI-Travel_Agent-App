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
      budgetDaily: 100,
      budgetFlights: 600,
      budgetHotels: 150,
      budgetStyle: 'comfortable' as const,
      vibes: [],
      partySize: {
        adults: 1,
        kids: 0,
      },
      maxFlightTime: undefined,
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
      // Calculate trip duration
      const startDate = new Date(data.dateRange.startDate);
      const endDate = new Date(data.dateRange.endDate);
      const tripDuration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Calculate total budget using new breakdown
      const totalTravelers = data.partySize.adults + data.partySize.kids;
      const totalBudgetPerPerson = (data.budgetDaily * tripDuration) + (data.budgetHotels * tripDuration) + data.budgetFlights;
      const totalBudget = totalBudgetPerPerson * totalTravelers;
      
      // Default behavior: navigate to suggestions
      const params = new URLSearchParams({
        from: data.originAirport,
        startDate: data.dateRange.startDate,
        endDate: data.dateRange.endDate,
        tripDuration: tripDuration.toString(),
        budgetDaily: data.budgetDaily.toString(),
        budgetFlights: data.budgetFlights.toString(),
        budgetHotels: data.budgetHotels.toString(),
        budgetTotal: totalBudgetPerPerson.toString(),
        budgetStyle: data.budgetStyle,
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                className={`w-full px-3 py-3 min-h-[44px] text-base border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
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
                className={`w-full px-3 py-3 min-h-[44px] text-base border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
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

      {/* Budget Breakdown */}
      <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            <DollarSign className="inline w-5 h-5 mr-2" />
            Budget Breakdown (Per Person)
          </h3>
          <p className="text-sm text-gray-600">
            Set realistic budgets for each part of your trip to get better suggestions
          </p>
        </div>

        {/* Daily Spending Budget */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Daily Spending (Food, Activities, Local Transport)
          </label>
          <Controller
            name="budgetDaily"
            control={control}
            render={({ field }) => (
              <div className="space-y-3">
                <input
                  type="range"
                  min="30"
                  max="500"
                  step="10"
                  value={field.value}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                  className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>$30/day</span>
                  <span className="font-semibold text-blue-600">
                    ${field.value}/day
                  </span>
                  <span>$500/day</span>
                </div>
                <div className="text-xs text-gray-500">
                  {field.value <= 50 && "Budget traveler: Street food, free activities, walking"}
                  {field.value > 50 && field.value <= 150 && "Comfortable: Local restaurants, paid attractions, some taxis"}
                  {field.value > 150 && "Premium: Fine dining, premium experiences, private transport"}
                </div>
              </div>
            )}
          />
          {errors.budgetDaily && (
            <p className="text-sm text-red-600">{errors.budgetDaily.message}</p>
          )}
        </div>

        {/* Flight Budget */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Flight Budget (Round Trip)
          </label>
          <Controller
            name="budgetFlights"
            control={control}
            render={({ field }) => (
              <div className="space-y-3">
                <input
                  type="range"
                  min="100"
                  max="3000"
                  step="50"
                  value={field.value}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                  className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>$100</span>
                  <span className="font-semibold text-green-600">${field.value.toLocaleString()}</span>
                  <span>$3,000+</span>
                </div>
                <div className="text-xs text-gray-500">
                  {field.value <= 300 && "Domestic/nearby destinations, budget airlines"}
                  {field.value > 300 && field.value <= 800 && "Regional flights, economy class"}
                  {field.value > 800 && field.value <= 1500 && "International economy, premium economy"}
                  {field.value > 1500 && "Business class, long-haul premium flights"}
                </div>
              </div>
            )}
          />
          {errors.budgetFlights && (
            <p className="text-sm text-red-600">{errors.budgetFlights.message}</p>
          )}
        </div>

        {/* Hotel Budget */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Accommodation Budget (Per Night)
          </label>
          <Controller
            name="budgetHotels"
            control={control}
            render={({ field }) => (
              <div className="space-y-3">
                <input
                  type="range"
                  min="40"
                  max="500"
                  step="20"
                  value={field.value}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                  className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>$40/night</span>
                  <span className="font-semibold text-purple-600">
                    ${field.value}/night
                  </span>
                  <span>$500+/night</span>
                </div>
                <div className="text-xs text-gray-500">
                  {field.value <= 80 && "Hostels, budget motels, shared accommodations"}
                  {field.value > 80 && field.value <= 200 && "Mid-range hotels, good Airbnbs, 3-star properties"}
                  {field.value > 200 && "Luxury hotels, premium locations, 4-5 star properties"}
                </div>
              </div>
            )}
          />
          {errors.budgetHotels && (
            <p className="text-sm text-red-600">{errors.budgetHotels.message}</p>
          )}
        </div>

        {/* Total Budget Summary */}
        <div className="bg-white p-4 rounded-lg border-2 border-purple-200">
          <h4 className="font-semibold text-gray-900 mb-2">Trip Cost Summary (Per Person)</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Daily spending:</span>
              <span>${watch('budgetDaily')}/day</span>
            </div>
            <div className="flex justify-between">
              <span>Accommodation:</span>
              <span>${watch('budgetHotels')}/night</span>
            </div>
            <div className="flex justify-between">
              <span>Flights (round trip):</span>
              <span>${watch('budgetFlights').toLocaleString()}</span>
            </div>
            
            {/* Total calculation */}
            {watch('dateRange.startDate') && watch('dateRange.endDate') && (
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-semibold text-base text-purple-700">
                  <span>Total per person:</span>
                  <span>
                    ${(() => {
                      const tripDuration = Math.ceil((new Date(watch('dateRange.endDate')).getTime() - new Date(watch('dateRange.startDate')).getTime()) / (1000 * 60 * 60 * 24));
                      return (watch('budgetDaily') * tripDuration + watch('budgetHotels') * tripDuration + watch('budgetFlights')).toLocaleString();
                    })()}
                  </span>
                </div>
                {watch('partySize.adults') + watch('partySize.kids') > 1 && (
                  <div className="flex justify-between text-sm text-gray-600 mt-1">
                    <span>Total for {watch('partySize.adults') + watch('partySize.kids')} travelers:</span>
                    <span>
                      ${(() => {
                        const tripDuration = Math.ceil((new Date(watch('dateRange.endDate')).getTime() - new Date(watch('dateRange.startDate')).getTime()) / (1000 * 60 * 60 * 24));
                        const totalPerPerson = watch('budgetDaily') * tripDuration + watch('budgetHotels') * tripDuration + watch('budgetFlights');
                        return (totalPerPerson * (watch('partySize.adults') + watch('partySize.kids'))).toLocaleString();
                      })()}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Budget Style */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Trip Style
        </label>
        <p className="text-xs text-gray-600">
          Choose your preferred spending level for accommodation, dining, and activities
        </p>
        <Controller
          name="budgetStyle"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-3 gap-3">
              {[
                { 
                  value: 'budget', 
                  label: 'Budget', 
                  icon: '💰', 
                  description: 'Hostels, street food, free activities',
                  multiplier: '0.7x'
                },
                { 
                  value: 'comfortable', 
                  label: 'Comfortable', 
                  icon: '🏨', 
                  description: 'Mid-range hotels, local restaurants',
                  multiplier: '1x'
                },
                { 
                  value: 'luxury', 
                  label: 'Luxury', 
                  icon: '✨', 
                  description: 'Premium hotels, fine dining',
                  multiplier: '1.5x'
                }
              ].map((style) => (
                <button
                  key={style.value}
                  type="button"
                  onClick={() => field.onChange(style.value)}
                  className={`p-4 min-h-[80px] rounded-lg border-2 text-sm font-medium transition-all duration-200 ${
                    field.value === style.value
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-25'
                  }`}
                >
                  <div className="text-xl mb-1">{style.icon}</div>
                  <div className="font-semibold">{style.label}</div>
                  <div className="text-xs text-gray-500 mt-1 leading-tight">{style.description}</div>
                  <div className="text-xs font-medium text-purple-600 mt-1">{style.multiplier}</div>
                </button>
              ))}
            </div>
          )}
        />
        {errors.budgetStyle && (
          <p className="text-sm text-red-600">{errors.budgetStyle.message}</p>
        )}
      </div>

      {/* Vibes */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          What kind of trip vibe are you looking for? <span className="text-gray-500 font-normal">(Optional)</span>
        </label>
        <p className="text-xs text-gray-600">
          Select any interests to help personalize your trip, or skip to get general suggestions
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {vibeOptions.map((vibe) => (
            <button
              key={vibe.id}
              type="button"
              onClick={() => handleVibeToggle(vibe.id)}
              className={`p-4 min-h-[44px] rounded-lg border-2 text-sm font-medium transition-all duration-200 ${
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  className={`w-full px-3 py-3 min-h-[44px] text-base border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
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
                  className={`w-full px-3 py-3 min-h-[44px] text-base border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
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
                    value={field.value || ''}
                    min="1"
                    max="24"
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-3 py-3 min-h-[44px] text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Any (leave empty for no limit)"
                  />
                )}
              />
              <p className="text-xs text-gray-500">
                Leave empty for any flight duration, or specify max hours (e.g., 8, 12, 16)
              </p>
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
                    className="w-full px-3 py-3 min-h-[44px] text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
          className="w-full sm:w-auto px-8 py-4 min-h-[44px] text-lg rounded-lg font-semibold text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          style={{
            backgroundColor: !isValid || isLoading ? '#9ca3af' : '#7c3aed',
            color: 'white',
            border: 'none',
            cursor: !isValid || isLoading ? 'not-allowed' : 'pointer'
          }}
          onMouseEnter={(e) => {
            if (!(!isValid || isLoading)) {
              e.target.style.backgroundColor = '#6d28d9';
            }
          }}
          onMouseLeave={(e) => {
            if (!(!isValid || isLoading)) {
              e.target.style.backgroundColor = '#7c3aed';
            }
          }}
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
