'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Calendar, Users, DollarSign, MapPin, Plane, Clock } from 'lucide-react';
import { tripPlannerSchema, type TripPlannerFormData, vibeOptions } from '@/lib/validations/trip';
import AirportAutocomplete from '@/components/AirportAutocomplete';
import PillSlider from '@/components/ui/PillSlider';

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
      tripType: 'single' as const,
      numberOfStops: 3,
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
        tripType: (data.tripType ?? 'single'),
        ...(data.tripType && data.tripType !== 'single' && data.numberOfStops != null && { numberOfStops: String(data.numberOfStops) }),
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
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      {/* Section 1: Origin Airport */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-sm">
              1
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              Where are you starting your journey?
            </h3>
          </div>
          <p className="text-sm text-gray-600 ml-10">
            Let's begin with your departure location. This helps us find the best flight options for you.
          </p>
        </div>
        <div className="space-y-2">
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
      </section>

      {/* Section 2: Date Range */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-sm">
              2
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              When would you like to travel?
            </h3>
          </div>
          <p className="text-sm text-gray-600 ml-10">
            Choose your travel dates. We'll calculate the trip duration and adjust recommendations accordingly.
          </p>
        </div>
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
      </section>

      {/* Section 3: Trip type — single vs multi-destination */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-sm">
              3
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              What kind of trip?
            </h3>
          </div>
          <p className="text-sm text-gray-600 ml-10">
            One place, or several cities and countries? We can suggest single destinations or full itineraries.
          </p>
        </div>
        <div className="space-y-4 ml-10">
          <div className="flex flex-wrap gap-3">
            {[
              { value: 'single', label: 'Single destination', desc: 'One city or region' },
              { value: 'multi-city', label: 'Multiple cities', desc: 'Several places in one country' },
              { value: 'multi-country', label: 'Multiple countries', desc: 'e.g. Europe or Southeast Asia' },
            ].map((opt) => (
              <label
                key={opt.value}
                className={`flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  watch('tripType') === opt.value
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-200'
                }`}
              >
                <input
                  type="radio"
                  name="tripType"
                  value={opt.value}
                  checked={watch('tripType') === opt.value}
                  onChange={() => setValue('tripType', opt.value as 'single' | 'multi-city' | 'multi-country')}
                  className="sr-only"
                />
                <span className="font-medium text-gray-900">{opt.label}</span>
                <span className="text-sm text-gray-600">{opt.desc}</span>
              </label>
            ))}
          </div>
          {watch('tripType') !== 'single' && (
            <div className="pt-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Number of stops</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 2, label: '2 stops' },
                  { value: 3, label: '3 stops' },
                  { value: 4, label: '4 stops' },
                  { value: 5, label: '5 stops' },
                  { value: 7, label: '6–9 stops' },
                  { value: 10, label: '10+ stops' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setValue('numberOfStops', value)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm ${
                      watch('numberOfStops') === value
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Section 4: Budget Breakdown */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-sm">
              4
            </div>
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-purple-600" />
              Let's Talk Budget
            </h3>
          </div>
          <p className="text-sm text-gray-600 ml-10">
            We understand budget is important. Set realistic budgets for each part of your trip so we can find options that match your comfort level and financial goals.
          </p>
        </div>
        <div className="space-y-6 bg-gray-50 p-6 rounded-lg">

        {/* Daily Spending Budget - Enhanced with Pill Slider */}
        <div className="space-y-4 lg:space-y-6">
          <Controller
            name="budgetDaily"
            control={control}
            render={({ field }) => (
              <PillSlider
                min={30}
                max={500}
                step={10}
                value={field.value}
                onChange={field.onChange}
                formatValue={(v) => `$${v}/day`}
                label="Daily Spending (Food, Activities, Local Transport)"
                description={
                  field.value <= 50 
                    ? "Budget traveler: Street food, free activities, walking"
                    : field.value > 50 && field.value <= 150 
                    ? "Comfortable: Local restaurants, paid attractions, some taxis"
                    : "Premium: Fine dining, premium experiences, private transport"
                }
              />
            )}
          />
          {errors.budgetDaily && (
            <p className="text-sm text-red-600">{errors.budgetDaily.message}</p>
          )}
        </div>

        {/* Flight Budget - Enhanced with Pill Slider */}
        <div className="space-y-4 lg:space-y-6">
          <Controller
            name="budgetFlights"
            control={control}
            render={({ field }) => (
              <PillSlider
                min={100}
                max={3000}
                step={50}
                value={field.value}
                onChange={field.onChange}
                formatValue={(v) => `$${v.toLocaleString()}`}
                label="Flight Budget (Round Trip)"
                description={
                  field.value <= 300 
                    ? "Domestic/nearby destinations, budget airlines"
                    : field.value > 300 && field.value <= 800 
                    ? "Regional flights, economy class"
                    : field.value > 800 && field.value <= 1500 
                    ? "International economy, premium economy"
                    : "Business class, long-haul premium flights"
                }
              />
            )}
          />
          {errors.budgetFlights && (
            <p className="text-sm text-red-600">{errors.budgetFlights.message}</p>
          )}
        </div>

        {/* Hotel Budget - Enhanced with Pill Slider */}
        <div className="space-y-4 lg:space-y-6">
          <Controller
            name="budgetHotels"
            control={control}
            render={({ field }) => (
              <PillSlider
                min={40}
                max={500}
                step={20}
                value={field.value}
                onChange={field.onChange}
                formatValue={(v) => `$${v}/night`}
                label="Accommodation Budget (Per Night)"
                description={
                  field.value <= 80 
                    ? "Hostels, budget motels, shared accommodations"
                    : field.value > 80 && field.value <= 200 
                    ? "Mid-range hotels, good Airbnbs, 3-star properties"
                    : "Luxury hotels, premium locations, 4-5 star properties"
                }
              />
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
            <div className="flex justify-between font-medium text-purple-700">
              <span>Daily total (spending + accommodation):</span>
              <span>${(watch('budgetDaily') + watch('budgetHotels')).toLocaleString()}/day</span>
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
      </section>

      {/* Section 5: Budget Style */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-sm">
              5
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              What's Your Travel Style?
            </h3>
          </div>
          <p className="text-sm text-gray-600 ml-10">
            This helps us understand your preferred comfort level. Don't worry—you can adjust individual budgets above if needed.
          </p>
        </div>
        <div className="space-y-3">
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
      </section>

      {/* Section 6: Vibes */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-sm">
              6
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              What Kind of Experience Are You Looking For?
            </h3>
          </div>
          <p className="text-sm text-gray-600 ml-10">
            Help us understand your interests and preferences. Select all that apply, or skip this step—we'll still find great options for you.
          </p>
        </div>
        <div className="space-y-3">
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
      </section>

      {/* Section 7: Party Size */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-sm">
              7
            </div>
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <Users className="w-5 h-5 mr-2 text-purple-600" />
              Who's Coming Along?
            </h3>
          </div>
          <p className="text-sm text-gray-600 ml-10">
            Tell us about your travel party. This helps us calculate total costs and find accommodations that fit your group.
          </p>
        </div>
        <div className="space-y-3">
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
      </section>

      {/* Section 8: Advanced Options */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-sm">
              8
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              Additional Preferences
            </h3>
          </div>
          <p className="text-sm text-gray-600 ml-10">
            Have specific requirements? We've got you covered. These options help us fine-tune your recommendations.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center text-sm text-gray-600 hover:text-purple-600 transition-colors mb-4"
        >
          <span>{showAdvanced ? 'Hide' : 'Show'} Additional Preferences</span>
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
      </section>

      {/* Submit Button */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-lg p-8 text-center">
        <div className="mb-4">
          <h3 className="text-2xl font-bold text-white mb-2">
            Ready to Discover Your Perfect Trip?
          </h3>
          <p className="text-purple-100">
            We'll analyze your preferences and create personalized suggestions just for you.
          </p>
        </div>
        <div className="flex justify-center">
        <button
          type="submit"
          disabled={!isValid || isLoading}
          className="px-12 py-4 min-h-[52px] text-lg rounded-lg font-semibold bg-white text-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600 mr-3"></div>
              Crafting Your Perfect Trip...
            </div>
          ) : (
            'Get My Personalized Trip Suggestions ✨'
          )}
        </button>
        </div>
      </div>
    </form>
  );
}
