#Coupon Hunter ... uses a bunch of coupons
#Fast and Filling ... buys things that can be cooked fast
#Party Snacker ... buys a lot of alcohol and snacks
#Gourmet Focus ... buys expensive premium goods
#All Organic ... looks out for organic things
#Vegetarian ... no meat
#Brand Buyer ... buys known brands

count = 3000

gender = c('Male', 'Female')

# create binary groups
customers = data.frame(
 ID = paste0('Customer', 1:count),
 Gender = sample(gender, count, replace=TRUE)
)

groups = data.frame(
 Coupon.Hunter = rbinom(count, 1, 0.4),
 Fast.and.Filling = rbinom(count, 1, 0.20),
 Party.Snacker = rbinom(count, 1, 0.3),
 Gourmet.Focus = rbinom(count, 1, 0.1),
 All.Organic = rbinom(count, 1, 0.2),
 Vegetarian = rbinom(count, 1, 0.15),
 Brand.Buyer = rbinom(count, 1, 0.22)
)

# create reveneous for each group
rev = data.frame(
 r_ch = groups$Coupon.Hunter * pmin(pmax(rnorm(count, 400, 300), 10), 800),
 r_ff = groups$Fast.and.Filling * pmin(pmax(rnorm(count, 800, 700), 200), 1400),
 r_ps = groups$Party.Snacker * pmin(pmax(rnorm(count, 500, 350), 100), 1200),
 r_gf = groups$Gourmet.Focus * pmin(pmax(rnorm(count, 1400, 700), 450), 2000),
 r_ag = groups$All.Organic * pmin(pmax(rnorm(count, 1500, 800), 600), 2500),
 r_vv = groups$Vegetarian * pmin(pmax(rnorm(count, 700, 400), 150), 1200),
 r_bb = groups$Brand.Buyer * pmin(pmax(rnorm(count, 900, 500), 300), 1500)
)

max_group = sapply(as.data.frame(t(rev)), which.max)
sum_rev = sapply(as.data.frame(t(rev)), sum)
base_rev = pmin(pmax(rnorm(count, 300, 300), 100), 800)

customers$Group = colnames(groups)[max_group]
customers$Revenue = round(sum_rev + base_rev, 2)
customers = cbind(customers, groups)

# remove no group customers
customers = customers[sum_rev > 0, ]
    

write.csv(customers, 'customers.csv', row.names=FALSE)
