Rails.application.routes.draw do
  # For details on the DSL available within this file, see https://guides.rubyonrails.org/routing.html
  root to: "meals#edit"
  get "/techchair", to: "techchair#index"

  resource :members, except: [:show]
  get "/members", to: "members#index"

  resource :meals, only: [:edit]
  post "/meals", to: "meals#update"
  get "/meals", to: "meals#index"
  get "/meals/list", to: "meals#list"
  post "/meals/list", to: "meals#list"
  get "cook", to: "meals#cook"
  post "cook", to: "meals#cook"
  get "late_plates", to: "meals#late_plates"
  get "reset_meals", to: "meals#reset_meals"

  resource :weekly_meals, only: [:edit]
  post "/weekly_meals", to: "weekly_meals#update"
  get "/weekly_meals", to: "weekly_meals#index"

  get "/menu", to: "menu#index"
  get "/menu/new", to: "menu#new"
  post "/menu/new", to: "menu#create"
  get "/menu/edit", to: "menu#edit"
  patch "/menu/edit", to: "menu#update"
  get "/menu/list", to: "menu#list"

end
