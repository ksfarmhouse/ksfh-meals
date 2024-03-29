Rails.application.routes.draw do
  # For details on the DSL available within this file, see https://guides.rubyonrails.org/routing.html
  root to: "meals#edit"
  get "/techchair", to: "techchair#index"
  get "/techchair/login", to: "techchair#login"
  post "/techchair/login", to: "techchair#login_post"
  get "/techchair/logout", to: "techchair#logout"
  get "/techchair/reset_password", to: "techchair#reset_password"
  get "/techchair/reset_techchair_password", to: "techchair#reset_techchair_password"
  post "/techchair/reset_techchair_password", to: "techchair#reset_techchair_password_post"

  resource :members, except: [:show]
  get "/members", to: "members#index"
  get "/members_ajax/:member_id", to: "members#members_ajax"
  get "/members_csv", to: "members#csv_export"
  get "/members/delete", to: "members#delete"
  get "/members/mass_edit", to: "members#mass_edit"
  post "/members/mass_edit", to: "members#mass_edit_update"
  get "activate_new_members", to: "members#activate_new_members"

  resource :meals, only: [:edit]
  get "/meals_ajax/:member_id/:date", to: "meals#meals_ajax"
  post "/meals", to: "meals#update"
  get "/meals", to: "meals#index"
  get "/meals_csv", to: "meals#csv_export"
  get "/meals/list", to: "meals#list"
  post "/meals/list", to: "meals#list"
  get "/meals/member_list", to: "meals#member_list"
  post "/meals/member_list", to: "meals#member_list"
  get "cook", to: "meals#cook"
  post "cook", to: "meals#cook"
  get "late_plates", to: "meals#late_plates"
  get "reset_meals", to: "meals#reset_meals"
  post "reset_meals_post", to: "meals#reset_meals_post"

  resource :weekly_meals, only: [:edit]
  post "/weekly_meals", to: "weekly_meals#update"
  get "/weekly_meals", to: "weekly_meals#index"

  get "/menu", to: "menu#index"
  get "/menu/new", to: "menu#new"
  post "/menu/new", to: "menu#create"
  get "/menu/edit", to: "menu#edit"
  patch "/menu/edit", to: "menu#update"
  get "/menu/list", to: "menu#list"
  get "/menu/delete", to: "menu#delete"

  get "/crew_numbers/edit", to: "crew_numbers#edit"
  patch "/crew_numbers/edit", to: "crew_numbers#update"
end
