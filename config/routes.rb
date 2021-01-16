Rails.application.routes.draw do
  # For details on the DSL available within this file, see https://guides.rubyonrails.org/routing.html
  root to: "meals#edit"
  resource :members
  resource :meals, only: [:index, :edit]
  post "/meals", to: "meals#update"
  resource :weekly_meals, only: [:index, :edit]
  post "/weekly_meals", to: "weekly_meals#update"
  get "/weekly_meals", to: "weekly_meals#index"
  resource :menu, except: [:show]

  get "reset_meals", to: "meals#reset_meals"
  get "cook", to: "meals#cook"
  post "cook/:date", to: "meals#cook"
  get "late_plates", to: "meals#late_plates"
end
