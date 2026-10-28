import { PageHeader } from "@/components/layout/main-layout"
import { useListLibraries, useListBooks, useListBorrowings } from "@workspace/api-client-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Library, BookOpen, Clock, MapPin, Phone } from "lucide-react"
import { DistrictSelect } from "@/components/district-select"
import { useDistrict } from "@/lib/districts"

export default function Libraries() {
  const [district, setDistrict] = useDistrict()
  const { data: libraries, isLoading: loadingLibs } = useListLibraries({ district })
  const { data: books, isLoading: loadingBooks } = useListBooks({ district })
  const libraryName = (id: string) => libraries?.find((l) => l.id === id)?.name
  const { data: borrowings, isLoading: loadingBorrowings } = useListBorrowings()

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Public Libraries" 
        description={`Public libraries and their catalogue in ${district}, plus your borrowings.`}
      >
        <DistrictSelect value={district} onChange={setDistrict} />
      </PageHeader>

      <Tabs defaultValue="branches" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="branches" className="gap-2"><Library className="w-4 h-4" /> Branches</TabsTrigger>
          <TabsTrigger value="catalog" className="gap-2"><BookOpen className="w-4 h-4" /> Catalog</TabsTrigger>
          <TabsTrigger value="borrowings" className="gap-2"><Clock className="w-4 h-4" /> My Borrowings</TabsTrigger>
        </TabsList>

        <TabsContent value="branches" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {loadingLibs ? (
              Array(2).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)
            ) : libraries?.length === 0 ? (
              <Card className="col-span-full border-dashed">
                <CardContent className="py-12 text-center text-muted-foreground">{`No libraries listed for ${district} yet.`}</CardContent>
              </Card>
            ) : libraries?.map((lib) => (
              <Card key={lib.id} className="hover-elevate">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-xl font-serif">{lib.name}</h3>
                    <Badge variant={lib.isActive ? 'default' : 'secondary'}>
                      {lib.isActive ? 'Open' : 'Closed'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3 text-sm text-muted-foreground mb-6">
                    <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> {lib.address}</div>
                    {lib.phone && lib.phone !== "Not listed" && (
                      <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-primary" /> {lib.phone}</div>
                    )}
                    <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> {lib.openingTime} - {lib.closingTime}</div>
                  </div>

                  <div className="flex gap-4 p-3 bg-muted rounded-lg text-sm text-center">
                    <div className="flex-1">
                      <div className="font-bold text-foreground text-lg">{lib.totalBooks.toLocaleString("en-IN")}</div>
                      <div>Total Books</div>
                    </div>
                    <div className="w-px bg-border" />
                    <div className="flex-1">
                      <div className="font-bold text-foreground text-lg">{lib.availableBooks.toLocaleString("en-IN")}</div>
                      <div>Available</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="catalog">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loadingBooks ? (
              Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
            ) : books?.data.length === 0 ? (
              <Card className="col-span-full border-dashed">
                <CardContent className="py-12 text-center text-muted-foreground">{`No books catalogued for ${district} yet.`}</CardContent>
              </Card>
            ) : books?.data.map((book) => (
              <Card key={book.id}>
                <CardContent className="p-5 flex gap-4">
                  <div className="w-16 h-24 bg-muted rounded border shrink-0 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-muted-foreground/50" />
                  </div>
                  <div className="flex flex-col justify-between py-1">
                    <div>
                      <h4 className="font-bold font-serif leading-tight mb-1">{book.title}</h4>
                      <p className="text-sm text-muted-foreground">{book.author}{book.publishedYear ? ` · ${book.publishedYear}` : ""}</p>
                      {libraryName(book.libraryId) && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Library className="w-3 h-3" /> {libraryName(book.libraryId)}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="outline" className="text-[10px]">{book.genre}</Badge>
                      <span className={book.isAvailable ? "text-xs font-medium text-emerald-600" : "text-xs font-medium text-muted-foreground"}>
                        {book.isAvailable ? 'Available' : 'Checked Out'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="borrowings">
          <Card>
            <CardContent className="p-0">
              {loadingBorrowings ? (
                <div className="p-6"><Skeleton className="h-20 w-full" /></div>
              ) : borrowings?.length === 0 ? (
                <div className="py-12 text-center">
                  <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <CardTitle>No active borrowings</CardTitle>
                </div>
              ) : (
                <div className="divide-y">
                  {borrowings?.map(borrow => (
                    <div key={borrow.id} className="p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div>
                        <h4 className="font-bold font-serif">{borrow.book.title}</h4>
                        <p className="text-sm text-muted-foreground">Borrowed: {new Date(borrow.borrowedAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={borrow.status === 'overdue' ? 'destructive' : borrow.status === 'returned' ? 'secondary' : 'default'} className="mb-2 uppercase">
                          {borrow.status}
                        </Badge>
                        {borrow.status !== 'returned' && (
                          <p className="text-sm font-medium">Due: {new Date(borrow.dueDate).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
