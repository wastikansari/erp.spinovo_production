'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  RefreshCw, 
  AlertCircle,
  MapPin,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  Building,
  Map
} from 'lucide-react';
import { LocationApiService } from '@/lib/api';
import { State, City, Area } from '@/lib/types/location';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { StateForm } from '@/components/forms/state-form';
import { CityForm } from '@/components/forms/city-form';
import { AreaForm } from '@/components/forms/area-form';

export default function LocationsPage() {
  const [states, setStates] = useState<State[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [expandedStates, setExpandedStates] = useState<Set<string>>(new Set());
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set());
  
  // Form states
  const [showStateForm, setShowStateForm] = useState(false);
  const [showCityForm, setShowCityForm] = useState(false);
  const [showAreaForm, setShowAreaForm] = useState(false);
  const [selectedState, setSelectedState] = useState<State | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [selectedStateId, setSelectedStateId] = useState<string>('');
  const [selectedCityId, setSelectedCityId] = useState<string>('');
  
  // Delete confirmation states
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type: 'state' | 'city' | 'area';
    item: any;
    stateId?: string;
    cityId?: string;
  }>({ open: false, type: 'state', item: null });

  const { toast } = useToast();

  const fetchStates = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await LocationApiService.getStates();
      
      if (response.status && response.data) {
        setStates(response.data.data || []);
        toast({
          title: 'Success',
          description: `Loaded ${response.data.data?.length || 0} states`,
        });
      } else {
        const errorMsg = response.msg || 'Failed to fetch states';
        setError(errorMsg);
        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive',
        });
        setStates([]);
      }
    } catch (error) {
      console.error('Error fetching states:', error);
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: 'Network error. Please check your connection and try again.',
        variant: 'destructive',
      });
      setStates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStates();
  }, []);

  const handleRefresh = () => {
    fetchStates();
  };

  const toggleStateExpansion = (stateId: string) => {
    const newExpanded = new Set(expandedStates);
    if (newExpanded.has(stateId)) {
      newExpanded.delete(stateId);
    } else {
      newExpanded.add(stateId);
    }
    setExpandedStates(newExpanded);
  };

  const toggleCityExpansion = (cityId: string) => {
    const newExpanded = new Set(expandedCities);
    if (newExpanded.has(cityId)) {
      newExpanded.delete(cityId);
    } else {
      newExpanded.add(cityId);
    }
    setExpandedCities(newExpanded);
  };

  // State handlers
  const handleCreateState = () => {
    setSelectedState(null);
    setShowStateForm(true);
  };

  const handleEditState = (state: State) => {
    setSelectedState(state);
    setShowStateForm(true);
  };

  const handleDeleteState = (state: State) => {
    setDeleteDialog({
      open: true,
      type: 'state',
      item: state,
    });
  };

  // City handlers
  const handleCreateCity = (stateId: string) => {
    setSelectedCity(null);
    setSelectedStateId(stateId);
    setShowCityForm(true);
  };

  const handleEditCity = (city: City, stateId: string) => {
    setSelectedCity(city);
    setSelectedStateId(stateId);
    setShowCityForm(true);
  };

  const handleDeleteCity = (city: City, stateId: string) => {
    setDeleteDialog({
      open: true,
      type: 'city',
      item: city,
      stateId,
    });
  };

  // Area handlers
  const handleCreateArea = (stateId: string, cityId: string) => {
    setSelectedArea(null);
    setSelectedStateId(stateId);
    setSelectedCityId(cityId);
    setShowAreaForm(true);
  };

  const handleEditArea = (area: Area, stateId: string, cityId: string) => {
    setSelectedArea(area);
    setSelectedStateId(stateId);
    setSelectedCityId(cityId);
    setShowAreaForm(true);
  };

  const handleDeleteArea = (area: Area, stateId: string, cityId: string) => {
    setDeleteDialog({
      open: true,
      type: 'area',
      item: area,
      stateId,
      cityId,
    });
  };

  const confirmDelete = async () => {
    try {
      const { type, item, stateId, cityId } = deleteDialog;
      
      let response;
      switch (type) {
        case 'state':
          response = await LocationApiService.deleteState(item._id);
          break;
        case 'city':
          response = await LocationApiService.deleteCity(stateId!, item.cityId);
          break;
        case 'area':
          response = await LocationApiService.deleteArea(stateId!, cityId!, item.areaId);
          break;
      }

      if (response.status) {
        toast({
          title: 'Success',
          description: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`,
        });
        fetchStates();
      } else {
        toast({
          title: 'Error',
          description: response.msg || `Failed to delete ${type}`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Error',
        description: `Failed to delete ${deleteDialog.type}. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setDeleteDialog({ open: false, type: 'state', item: null });
    }
  };

  const getStatusBadge = (status: boolean) => (
    <Badge variant={status ? "default" : "secondary"}>
      {status ? 'Active' : 'Inactive'}
    </Badge>
  );

  if (loading && states.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Locations</h1>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <LoadingSpinner size="lg" text="Loading locations..." />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Locations</h1>
          <div className="flex items-center gap-2">
            <Button onClick={handleRefresh} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={handleCreateState} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add State
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map className="h-5 w-5" />
              Location Management
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              Total States: {states.length}
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {states.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {error ? "Failed to load locations." : "No states found. Create your first state to get started."}
              </div>
            ) : (
              <div className="space-y-4">
                {states.map((state) => (
                  <div key={state._id} className="border rounded-lg">
                    <Collapsible
                      open={expandedStates.has(state._id)}
                      onOpenChange={() => toggleStateExpansion(state._id)}
                    >
                      <div className="flex items-center justify-between p-4 hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm">
                              {expandedStates.has(state._id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                          <MapPin className="h-5 w-5 text-primary" />
                          <div>
                            <h3 className="font-semibold">{state.stateName}</h3>
                            <p className="text-sm text-muted-foreground">
                              ID: {state.stateId} • Cities: {state.cities?.length || 0}
                            </p>
                          </div>
                          {getStatusBadge(state.status)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleCreateCity(state._id)}
                            variant="outline"
                            size="sm"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add City
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditState(state)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit State
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteState(state)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete State
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      <CollapsibleContent>
                        <div className="px-4 pb-4 space-y-3">
                          {state.cities?.map((city) => (
                            <div key={city.cityId} className="ml-8 border rounded-lg">
                              <Collapsible
                                open={expandedCities.has(city.cityId)}
                                onOpenChange={() => toggleCityExpansion(city.cityId)}
                              >
                                <div className="flex items-center justify-between p-3 hover:bg-muted/30">
                                  <div className="flex items-center gap-3">
                                    <CollapsibleTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        {expandedCities.has(city.cityId) ? (
                                          <ChevronDown className="h-3 w-3" />
                                        ) : (
                                          <ChevronRight className="h-3 w-3" />
                                        )}
                                      </Button>
                                    </CollapsibleTrigger>
                                    <Building className="h-4 w-4 text-blue-600" />
                                    <div>
                                      <h4 className="font-medium">{city.cityName}</h4>
                                      <p className="text-xs text-muted-foreground">
                                        ID: {city.cityId} • Areas: {city.pincodes?.length || 0} • 
                                        Handling: ₹{city.handlingCharge} • Platform: ₹{city.platformCharge}
                                      </p>
                                    </div>
                                    {getStatusBadge(city.status)}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      onClick={() => handleCreateArea(state._id, city.cityId)}
                                      variant="outline"
                                      size="sm"
                                    >
                                      <Plus className="mr-1 h-3 w-3" />
                                      Add Area
                                    </Button>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                          <MoreHorizontal className="h-3 w-3" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleEditCity(city, state._id)}>
                                          <Edit className="mr-2 h-3 w-3" />
                                          Edit City
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          onClick={() => handleDeleteCity(city, state._id)}
                                          className="text-destructive"
                                        >
                                          <Trash2 className="mr-2 h-3 w-3" />
                                          Delete City
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>

                                <CollapsibleContent>
                                  <div className="px-3 pb-3 space-y-2">
                                    {city.pincodes?.map((area) => (
                                      <div key={area.areaId} className="ml-6 flex items-center justify-between p-2 border rounded bg-muted/20">
                                        <div className="flex items-center gap-2">
                                          <MapPin className="h-3 w-3 text-green-600" />
                                          <div>
                                            <span className="font-medium text-sm">{area.areaName}</span>
                                            <span className="text-xs text-muted-foreground ml-2">
                                              ID: {area.areaId} • PIN: {area.pincode}
                                            </span>
                                          </div>
                                          {getStatusBadge(area.status)}
                                        </div>
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm">
                                              <MoreHorizontal className="h-3 w-3" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEditArea(area, state._id, city.cityId)}>
                                              <Edit className="mr-2 h-3 w-3" />
                                              Edit Area
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                              onClick={() => handleDeleteArea(area, state._id, city.cityId)}
                                              className="text-destructive"
                                            >
                                              <Trash2 className="mr-2 h-3 w-3" />
                                              Delete Area
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    ))}
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Forms */}
        <StateForm
          open={showStateForm}
          onOpenChange={setShowStateForm}
          onSuccess={fetchStates}
          state={selectedState}
        />

        <CityForm
          open={showCityForm}
          onOpenChange={setShowCityForm}
          onSuccess={fetchStates}
          stateId={selectedStateId}
          city={selectedCity}
        />

        <AreaForm
          open={showAreaForm}
          onOpenChange={setShowAreaForm}
          onSuccess={fetchStates}
          stateId={selectedStateId}
          cityId={selectedCityId}
          area={selectedArea}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this {deleteDialog.type}? This action cannot be undone.
                {deleteDialog.type === 'state' && deleteDialog.item?.cities?.length > 0 && (
                  <div className="mt-2 p-2 bg-destructive/10 rounded text-destructive text-sm">
                    Warning: This state contains cities. You may need to remove all cities first.
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ErrorBoundary>
  );
}