Rails.application.routes.draw do
  # For details on the DSL available within this file, see https://guides.rubyonrails.org/routing.html
  root to: "meals#edit"
  resource :users
  resource :meals, only: [:index, :edit]
  post "/meals", to: "meals#update"
  resource :weekly_meals, only: [:index, :edit, :update]
  post "/weekly_meals", to: "meals#update"
  resource :menu, except: [:show]

  get "reset_meals", to: "reset_meals#index"
  get "cook", to: "cook#index"
  get "late_plates", to: "late_plates#index"
end
